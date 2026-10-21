import {
  MAX_LAPS,
  MAX_SESSION_MS,
  parseLapSession,
  sameLapSession,
} from './lap-sessions'

const session = {
  id: 'b3b286cc-8ce6-4518-b6d3-b663beb88f78',
  started_at: '2026-10-21T10:00:00.000Z',
  finished_at: '2026-10-21T10:03:00.000Z',
  elapsed_ms: 180000.375,
  laps_ms: [60000.125, 65000.125, 55000.125],
}

it('preserves milliseconds and strips client-supplied ownership and server fields', () => {
  expect(
    parseLapSession({
      ...session,
      user_id: 'someone-else',
      created_at: 'fake',
    }),
  ).toEqual(session)
  expect(parseLapSession({ ...session, laps_ms: [] })).not.toBeNull()
  expect(
    sameLapSession(session, {
      ...session,
      started_at: '2026-10-21T10:00:00+00:00',
    }),
  ).toBe(true)
  expect(
    sameLapSession(session, {
      ...session,
      laps_ms: [...session.laps_ms].reverse(),
    }),
  ).toBe(false)
})

it.each([
  null,
  [],
  {},
  { ...session, id: 'bad' },
  { ...session, started_at: '2026-02-30T10:00:00.000Z' },
  { ...session, finished_at: '2026-10-21T09:00:00.000Z' },
  { ...session, elapsed_ms: '180000' },
  { ...session, elapsed_ms: NaN },
  { ...session, elapsed_ms: Infinity },
  { ...session, elapsed_ms: -1 },
  { ...session, elapsed_ms: MAX_SESSION_MS + 1 },
  { ...session, laps_ms: [0] },
  { ...session, laps_ms: [-1] },
  { ...session, laps_ms: [NaN] },
  { ...session, laps_ms: [Infinity] },
  { ...session, laps_ms: [null] },
  { ...session, laps_ms: ['60000'] },
  { ...session, laps_ms: [180001] },
  { ...session, laps_ms: Array(MAX_LAPS + 1).fill(1) },
])('rejects malformed session %#', (value) => {
  expect(parseLapSession(value)).toBeNull()
})
