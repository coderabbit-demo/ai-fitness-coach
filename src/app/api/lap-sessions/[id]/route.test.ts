import { NextRequest } from 'next/server'
import { GET } from './route'
import { createClient } from '@/utils/supabase/server'

jest.mock('@/utils/supabase/server', () => ({ createClient: jest.fn() }))
const id = 'b3b286cc-8ce6-4518-b6d3-b663beb88f78'
const context = { params: Promise.resolve({ id }) }
const request = () =>
  new NextRequest(`http://localhost/api/lap-sessions/${id}`, {
    headers: { 'X-Lap-Tracker-User': 'user-a' },
  })

function setup(user: { id: string } | null = { id: 'user-a' }) {
  const query = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest
      .fn()
      .mockResolvedValue({ data: { id, laps_ms: [60000.125] }, error: null }),
  }
  const client = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from: jest.fn().mockReturnValue(query),
  }
  jest.mocked(createClient).mockResolvedValue(client as never)
  return { query, client }
}

it('returns ordered lap details only for the authenticated bound account', async () => {
  const { query } = setup()
  const response = await GET(request(), context)
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ data: { id, laps_ms: [60000.125] } })
  expect(query.eq).toHaveBeenCalledWith('user_id', 'user-a')
  expect(query.eq).toHaveBeenCalledWith('id', id)
  expect(response.headers.get('Cache-Control')).toBe('private, no-store')
})

it('requires authentication and rejects an account switch before querying details', async () => {
  let mock = setup(null)
  expect((await GET(request(), context)).status).toBe(401)
  expect(mock.client.from).not.toHaveBeenCalled()
  mock = setup({ id: 'user-b' })
  expect((await GET(request(), context)).status).toBe(409)
  expect(mock.client.from).not.toHaveBeenCalled()
})

it('validates IDs and returns 404 without exposing whether another user owns the ID', async () => {
  const { query, client } = setup()
  expect(
    (await GET(request(), { params: Promise.resolve({ id: 'bad' }) })).status,
  ).toBe(400)
  expect(client.from).not.toHaveBeenCalled()
  query.maybeSingle.mockResolvedValue({ data: null, error: null })
  expect((await GET(request(), context)).status).toBe(404)
})

it('returns retryable errors without database details', async () => {
  const { query } = setup()
  query.maybeSingle.mockResolvedValue({
    data: null,
    error: { message: 'private detail' },
  })
  const response = await GET(request(), context)
  expect(response.status).toBe(500)
  expect(JSON.stringify(await response.json())).not.toContain('private detail')
})
