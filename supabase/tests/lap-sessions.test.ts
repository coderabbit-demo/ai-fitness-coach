import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const userA = '11111111-1111-4111-8111-111111111111'
const userB = '22222222-2222-4222-8222-222222222222'
const sessionId = 'b3b286cc-8ce6-4518-b6d3-b663beb88f78'
let db: PGlite
const insert = `INSERT INTO public.lap_sessions (user_id, id, started_at, finished_at, elapsed_ms, laps_ms)
  VALUES ($1, $2, '2026-10-21T10:00:00Z', '2026-10-21T10:03:00Z', $3, $4)`

async function asUser(userId: string, sql: string, params: unknown[] = []) {
  await db.exec('BEGIN; SET LOCAL ROLE authenticated;')
  try {
    await db.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [
      userId,
    ])
    return await db.query<Record<string, unknown>>(sql, params)
  } finally {
    await db.exec('ROLLBACK')
  }
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    CREATE ROLE anon NOLOGIN;
    CREATE ROLE authenticated NOLOGIN;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated, anon;
    GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, anon;
    INSERT INTO auth.users VALUES ('${userA}'), ('${userB}');
  `)
  await db.exec(
    readFileSync(
      join(process.cwd(), 'supabase/migrations/007_create_lap_sessions.sql'),
      'utf8',
    ),
  )
}, 30000)

beforeEach(async () => {
  await db.exec('TRUNCATE public.lap_sessions')
  await db.query(insert, [
    userA,
    sessionId,
    180000.375,
    [60000.125, 65000.125, 55000.125],
  ])
})
afterAll(async () => {
  await db?.close()
})

it('preserves ordered fractional milliseconds and computes the 60s average', async () => {
  const { rows } = await asUser(
    userA,
    'SELECT laps_ms, elapsed_ms FROM public.lap_sessions',
  )
  expect(rows).toEqual([
    { laps_ms: [60000.125, 65000.125, 55000.125], elapsed_ms: 180000.375 },
  ])
  const exact = await asUser(
    userA,
    'SELECT (SELECT avg(lap) FROM unnest(ARRAY[60000,65000,55000]) lap) AS average',
  )
  expect(Number(exact.rows[0].average)).toBe(60000)
})

it('hides other users sessions and rejects forged ownership, anonymous reads, updates and deletes', async () => {
  expect(
    (await asUser(userB, 'SELECT * FROM public.lap_sessions')).rows,
  ).toHaveLength(0)
  await expect(
    asUser(userB, insert, [userA, sessionId, 10, [10]]),
  ).rejects.toMatchObject({ code: '42501' })
  await expect(
    asUser(userA, 'UPDATE public.lap_sessions SET elapsed_ms = 1'),
  ).rejects.toMatchObject({ code: '42501' })
  await expect(
    asUser(userA, 'DELETE FROM public.lap_sessions'),
  ).rejects.toMatchObject({ code: '42501' })
  await db.exec('BEGIN; SET LOCAL ROLE anon')
  try {
    await expect(
      db.query('SELECT * FROM public.lap_sessions'),
    ).rejects.toMatchObject({ code: '42501' })
  } finally {
    await db.exec('ROLLBACK')
  }
})

it('deduplicates repeated inserts atomically and scopes identical IDs per user', async () => {
  const retry = `${insert} ON CONFLICT (user_id, id) DO NOTHING`
  const result = await asUser(userA, `${retry} RETURNING id`, [
    userA,
    sessionId,
    999,
    [999],
  ])
  expect(result.rows).toHaveLength(0)
  expect(
    (await asUser(userA, 'SELECT elapsed_ms FROM public.lap_sessions')).rows[0]
      .elapsed_ms,
  ).toBe(180000.375)
  expect(
    (
      await asUser(userB, `${retry} RETURNING id`, [
        userB,
        sessionId,
        999,
        [999],
      ])
    ).rows,
  ).toHaveLength(1)
})

it.each([
  [-1, []],
  [Infinity, []],
  [NaN, []],
  [604800001, []],
  [10, [0]],
  [10, [-1]],
  [10, [null]],
  [10, [Infinity]],
  [10, [NaN]],
  [10, [11]],
  [20000, Array(10001).fill(1)],
])(
  'enforces duration/lap constraints at the database boundary %#',
  async (elapsed, laps) => {
    await expect(
      asUser(userB, insert, [userB, sessionId, elapsed, laps]),
    ).rejects.toMatchObject({ code: '23514' })
  },
)

it('accepts empty lap history and rejects invalid timestamps and multidimensional arrays', async () => {
  expect(
    (
      await asUser(userB, `${insert} RETURNING laps_ms`, [
        userB,
        sessionId,
        0,
        [],
      ])
    ).rows[0].laps_ms,
  ).toEqual([])
  await expect(
    asUser(
      userA,
      `INSERT INTO public.lap_sessions VALUES ($1, gen_random_uuid(), '2026-10-21', '2026-10-20', 0, '{}', now())`,
      [userA],
    ),
  ).rejects.toMatchObject({ code: '23514' })
  await expect(
    asUser(
      userA,
      `INSERT INTO public.lap_sessions VALUES ($1, gen_random_uuid(), '2026-10-21', 'infinity', 0, '{}', now())`,
      [userA],
    ),
  ).rejects.toMatchObject({ code: '23514' })
  await expect(
    asUser(
      userA,
      `INSERT INTO public.lap_sessions VALUES ($1, gen_random_uuid(), '2026-10-21', '2026-10-21', 10, '{{1,2},{3,4}}', now())`,
      [userA],
    ),
  ).rejects.toMatchObject({ code: '23514' })
})
