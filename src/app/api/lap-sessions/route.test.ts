import { NextRequest } from 'next/server'
import { GET, POST } from './route'
import { createClient } from '@/utils/supabase/server'

jest.mock('@/utils/supabase/server', () => ({ createClient: jest.fn() }))

const session = {
  id: 'b3b286cc-8ce6-4518-b6d3-b663beb88f78',
  started_at: '2026-10-21T10:00:00.000Z',
  finished_at: '2026-10-21T10:03:00.000Z',
  elapsed_ms: 180000.375,
  laps_ms: [60000.125, 65000.125, 55000.125],
}
const request = (value: unknown = session) =>
  new NextRequest('http://localhost/api/lap-sessions', {
    method: 'POST',
    body: JSON.stringify(value),
  })

function mockClient(user: { id: string } | null = { id: 'user-a' }) {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data: [session], error: null }),
    single: jest.fn().mockResolvedValue({ data: session, error: null }),
    upsert: jest.fn().mockResolvedValue({ error: null }),
  }
  const client = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
    },
    from: jest.fn().mockReturnValue(query),
  }
  jest.mocked(createClient).mockResolvedValue(client as never)
  return { client, query }
}

beforeEach(() => jest.clearAllMocks())

it('requires a verified user for both APIs without accessing tables', async () => {
  const { client } = mockClient(null)
  expect(
    (await GET(new NextRequest('http://localhost/api/lap-sessions'))).status,
  ).toBe(401)
  expect((await POST(request())).status).toBe(401)
  expect(client.from).not.toHaveBeenCalled()
})

it('rejects a failed auth verification even if a user object is present', async () => {
  const { client } = mockClient()
  client.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-a' } },
    error: new Error('expired'),
  })
  expect((await POST(request())).status).toBe(401)
  expect(client.from).not.toHaveBeenCalled()
})

it('filters history by the verified user, pages deterministically, and prevents caching', async () => {
  const { query } = mockClient()
  const response = await GET(
    new NextRequest('http://localhost/api/lap-sessions?offset=20'),
  )
  expect(response.status).toBe(200)
  expect(query.eq).toHaveBeenCalledWith('user_id', 'user-a')
  expect(query.range).toHaveBeenCalledWith(20, 39)
  expect(query.order).toHaveBeenCalledWith('id', { ascending: false })
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
})

it.each(['-1', '1.5', '1abc', 'Infinity', '1000001'])(
  'rejects invalid pagination %s',
  async (offset) => {
    const { client } = mockClient()
    expect(
      (
        await GET(
          new NextRequest(`http://localhost/api/lap-sessions?offset=${offset}`),
        )
      ).status,
    ).toBe(400)
    expect(client.from).not.toHaveBeenCalled()
  },
)

it('accepts retries without changing saved data or trusting supplied ownership', async () => {
  const { query } = mockClient()
  for (let i = 0; i < 2; i++) {
    expect(
      (await POST(request({ ...session, user_id: 'user-b' }))).status,
    ).toBe(200)
  }
  expect(query.upsert).toHaveBeenCalledWith(
    { ...session, user_id: 'user-a' },
    {
      onConflict: 'user_id,id',
      ignoreDuplicates: true,
    },
  )
  expect(query.eq).toHaveBeenCalledWith('user_id', 'user-a')
  expect(query.eq).toHaveBeenCalledWith('id', session.id)
})

it('returns 409 for conflicting retries', async () => {
  const { query } = mockClient()
  query.single.mockResolvedValue({
    data: { ...session, elapsed_ms: 180001 },
    error: null,
  })
  expect((await POST(request())).status).toBe(409)
})

it('rejects malformed JSON and invalid times before inserting', async () => {
  const { query } = mockClient()
  expect(
    (
      await POST(
        new NextRequest('http://localhost/api/lap-sessions', {
          method: 'POST',
          body: '{',
        }),
      )
    ).status,
  ).toBe(400)
  expect((await POST(request({ ...session, laps_ms: [-1] }))).status).toBe(400)
  expect(query.upsert).not.toHaveBeenCalled()
})

it('returns retryable errors without leaking database details', async () => {
  const { query } = mockClient()
  query.upsert.mockResolvedValue({
    error: { message: 'private database details' },
  })
  const response = await POST(request())
  expect(response.status).toBe(500)
  expect(JSON.stringify(await response.json())).not.toContain(
    'private database details',
  )
  query.range.mockResolvedValue({
    data: null,
    error: { message: 'private database details' },
  })
  expect(
    (await GET(new NextRequest('http://localhost/api/lap-sessions'))).status,
  ).toBe(500)
})

it('allows a lost confirmation to be retried with the same payload', async () => {
  const { query } = mockClient()
  query.single.mockResolvedValueOnce({
    data: null,
    error: new Error('network'),
  })
  expect((await POST(request())).status).toBe(500)
  expect((await POST(request())).status).toBe(200)
})
