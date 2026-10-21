export type TimerStatus =
  'idle' | 'running' | 'paused' | 'finishing' | 'finished'

export interface LapTimer {
  status: TimerStatus
  elapsedMs: number
  runningSince: number | null
  laps: LapChunk | null
  lapCount: number
  completedMs: number
}

interface LapChunk {
  previous: LapChunk | null
  values: readonly number[]
}

// Persistent chunks bound each append to 100 copied values, rather than
// copying the entire session on every lap. Older chunks remain shared.
const CHUNK_SIZE = 100

function appendLap(timer: LapTimer, lap: number): LapTimer {
  const chunk = timer.laps
  return {
    ...timer,
    laps:
      chunk && chunk.values.length < CHUNK_SIZE
        ? { previous: chunk.previous, values: [...chunk.values, lap] }
        : { previous: chunk, values: [lap] },
    lapCount: timer.lapCount + 1,
    completedMs: timer.completedMs + lap,
  }
}

export function completedLaps(timer: Pick<LapTimer, 'laps'>): number[] {
  const chunks: (readonly number[])[] = []
  for (let chunk = timer.laps; chunk; chunk = chunk.previous)
    chunks.push(chunk.values)
  return chunks.reverse().flatMap((values) => [...values])
}

export function lapWindow(
  timer: Pick<LapTimer, 'laps' | 'lapCount'>,
  start: number,
  count: number,
): number[] {
  const parts: (readonly number[])[] = []
  let end = timer.lapCount
  for (let chunk = timer.laps; chunk && end > start; chunk = chunk.previous) {
    const chunkStart = end - chunk.values.length
    if (chunkStart < start + count)
      parts.push(
        chunk.values.slice(
          Math.max(0, start - chunkStart),
          Math.min(chunk.values.length, start + count - chunkStart),
        ),
      )
    end = chunkStart
  }
  return parts.reverse().flatMap((values) => [...values])
}

export const emptyTimer: LapTimer = {
  status: 'idle',
  elapsedMs: 0,
  runningSince: null,
  laps: null,
  lapCount: 0,
  completedMs: 0,
}

export type TimerAction =
  | { type: 'start' | 'lap' | 'pause' | 'resume' | 'finish'; now: number }
  | { type: 'complete'; recordPartial: boolean }
  | { type: 'cancel-finish' | 'reset' }

// The clock supplies timestamps, never a count of interval callbacks. A hidden
// tab can skip every repaint without losing any elapsed time.
export function elapsedTime(timer: LapTimer, now: number): number {
  return (
    timer.elapsedMs +
    (timer.runningSince === null ? 0 : Math.max(0, now - timer.runningSince))
  )
}

export function currentLapTime(timer: LapTimer, now: number): number {
  return Math.max(0, elapsedTime(timer, now) - timer.completedMs)
}

export function averageLapTime(lapsMs: readonly number[]): number | null {
  return lapsMs.length
    ? lapsMs.reduce((sum, lap) => sum + lap, 0) / lapsMs.length
    : null
}

export function lapTimerReducer(
  timer: LapTimer,
  action: TimerAction,
): LapTimer {
  switch (action.type) {
    case 'start':
      return timer.status === 'idle'
        ? { ...emptyTimer, status: 'running', runningSince: action.now }
        : timer
    case 'lap': {
      if (timer.status !== 'running') return timer
      const lap = currentLapTime(timer, action.now)
      return lap > 0 ? appendLap(timer, lap) : timer
    }
    case 'pause':
    case 'finish':
      if (
        timer.status !== 'running' &&
        !(action.type === 'finish' && timer.status === 'paused')
      )
        return timer
      return {
        ...timer,
        status: action.type === 'pause' ? 'paused' : 'finishing',
        elapsedMs: elapsedTime(timer, action.now),
        runningSince: null,
      }
    case 'resume':
      return timer.status === 'paused'
        ? { ...timer, status: 'running', runningSince: action.now }
        : timer
    case 'complete': {
      if (timer.status !== 'finishing') return timer
      const partial = currentLapTime(timer, 0)
      const finished =
        action.recordPartial && partial > 0 ? appendLap(timer, partial) : timer
      return { ...finished, status: 'finished' }
    }
    case 'cancel-finish':
      return timer.status === 'finishing'
        ? { ...timer, status: 'paused' }
        : timer
    case 'reset':
      return emptyTimer
  }
}

// Round only the presentation; calculations and persisted values retain ms.
export function formatLapTime(ms: number | null): string {
  if (ms === null) return '—'
  const hundredths = Math.round(ms / 10)
  const minutes = Math.floor(hundredths / 6000)
  const seconds = Math.floor(hundredths / 100) % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths % 100).padStart(2, '0')}`
}
