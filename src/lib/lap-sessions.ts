// Keep API and database limits in sync with migration 007.
export const MAX_SESSION_MS = 7 * 24 * 60 * 60 * 1000
export const MAX_LAPS = 10000
export const SESSION_PAGE_SIZE = 20
export const LAP_OWNER_HEADER = 'X-Lap-Tracker-User'

export interface LapSessionInput {
  id: string
  started_at: string
  finished_at: string
  elapsed_ms: number
  laps_ms: number[]
}

export interface LapSession extends LapSessionInput {
  created_at: string
}

export interface LapSessionSummary extends Omit<LapSession, 'laps_ms'> {
  lap_count: number
  completed_ms: number
}

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/

export function isLapSessionId(value: string): boolean {
  return uuid.test(value)
}

function isTimestamp(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    timestamp.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  )
}

export function parseLapSession(value: unknown): LapSessionInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const input = value as Record<string, unknown>
  const { id, started_at, finished_at, elapsed_ms, laps_ms } = input
  if (
    typeof id !== 'string' ||
    !uuid.test(id) ||
    !isTimestamp(started_at) ||
    !isTimestamp(finished_at)
  )
    return null
  if (Date.parse(finished_at) < Date.parse(started_at)) return null
  if (
    typeof elapsed_ms !== 'number' ||
    !Number.isFinite(elapsed_ms) ||
    elapsed_ms < 0 ||
    elapsed_ms > MAX_SESSION_MS
  )
    return null
  if (!Array.isArray(laps_ms) || laps_ms.length > MAX_LAPS) return null
  if (
    !laps_ms.every(
      (lap: unknown) =>
        typeof lap === 'number' &&
        Number.isFinite(lap) &&
        lap > 0 &&
        lap <= MAX_SESSION_MS,
    )
  )
    return null
  const total = laps_ms.reduce((sum: number, lap: number) => sum + lap, 0)
  if (total > elapsed_ms + 0.000001) return null
  // Reconstruct a whitelist: ownership and server-managed fields never come
  // from the request, even if a caller supplies them.
  return {
    id: id.toLowerCase(),
    started_at,
    finished_at,
    elapsed_ms,
    laps_ms: [...laps_ms],
  }
}

export function sameLapSession(
  a: LapSessionInput,
  b: LapSessionInput,
): boolean {
  return (
    a.id === b.id &&
    Date.parse(a.started_at) === Date.parse(b.started_at) &&
    Date.parse(a.finished_at) === Date.parse(b.finished_at) &&
    a.elapsed_ms === b.elapsed_ms &&
    a.laps_ms.length === b.laps_ms.length &&
    a.laps_ms.every((lap, i) => lap === b.laps_ms[i])
  )
}
