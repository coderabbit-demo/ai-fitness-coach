import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createClient, getUser, getSession } from './server'

vi.mock('next/headers')
vi.mock('@supabase/ssr')

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  has: vi.fn(),
  clear: vi.fn(),
  forEach: vi.fn(),
  [Symbol.iterator]: vi.fn()
}

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
    signInWithPassword: vi.fn(),
    signUp: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({ data: [], error: null })),
    insert: vi.fn(() => ({ data: [], error: null })),
    update: vi.fn(() => ({ data: [], error: null })),
    delete: vi.fn(() => ({ data: [], error: null }))
  })),
  rpc: vi.fn(),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn()
    }))
  }
}

describe('createClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockReturnValue(mockCookieStore as any)
    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as any)

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a Supabase client with correct configuration', () => {
    const client = createClient()

    expect(createServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          get: expect.any(Function),
          set: expect.any(Function),
          remove: expect.any(Function)
        })
      })
    )
    expect(client).toBe(mockSupabaseClient)
  })

  it('should handle cookie get operation correctly', () => {
    mockCookieStore.get.mockReturnValue({ value: 'test-cookie-value' })

    createClient()

    const cookieConfig = vi.mocked(createServerClient).mock.calls[0][2]
    const getCookie = cookieConfig.cookies.get

    const result = getCookie('test-cookie')
    expect(mockCookieStore.get).toHaveBeenCalledWith('test-cookie')
    expect(result).toBe('test-cookie-value')
  })

  it('should handle missing cookies in get operation', () => {
    mockCookieStore.get.mockReturnValue(undefined)

    createClient()

    const cookieConfig = vi.mocked(createServerClient).mock.calls[0][2]
    const getCookie = cookieConfig.cookies.get

    const result = getCookie('nonexistent-cookie')
    expect(result).toBeUndefined()
  })

  it('should handle cookie set operation and catch errors gracefully', () => {
    mockCookieStore.set.mockImplementation(() => {
      throw new Error('Cannot set cookie from Server Component')
    })

    createClient()

    const cookieConfig = vi.mocked(createServerClient).mock.calls[0][2]
    const setCookie = cookieConfig.cookies.set

    expect(() => setCookie('test-cookie', 'test-value', { httpOnly: true })).not.toThrow()
    expect(mockCookieStore.set).toHaveBeenCalledWith({
      name: 'test-cookie',
      value: 'test-value',
      httpOnly: true
    })
  })

  it('should handle cookie remove operation and catch errors gracefully', () => {
    mockCookieStore.set.mockImplementation(() => {
      throw new Error('Cannot remove cookie from Server Component')
    })

    createClient()

    const cookieConfig = vi.mocked(createServerClient).mock.calls[0][2]
    const removeCookie = cookieConfig.cookies.remove

    expect(() => removeCookie('test-cookie', { path: '/' })).not.toThrow()
    expect(mockCookieStore.set).toHaveBeenCalledWith({
      name: 'test-cookie',
      value: '',
      path: '/'
    })
  })

  it('should handle missing environment variables', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => createClient()).not.toThrow()

    expect(createServerClient).toHaveBeenCalledWith(
      undefined,
      undefined,
      expect.any(Object)
    )
  })

  it('should create new client instance on each call', () => {
    const client1 = createClient()
    const client2 = createClient()

    expect(createServerClient).toHaveBeenCalledTimes(2)
    expect(client1).toBe(mockSupabaseClient)
    expect(client2).toBe(mockSupabaseClient)
  })
})

describe('getUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockReturnValue(mockCookieStore as any)
    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as any)

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('should return user data when authenticated', async () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      user_metadata: {
        name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg'
      },
      app_metadata: { provider: 'email' },
      aud: 'authenticated',
      created_at: '2023-01-01T00:00:00.000Z',
      updated_at: '2023-01-01T00:00:00.000Z'
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    const result = await getUser()

    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      data: { user: mockUser },
      error: null
    })
  })

  it('should return null user when not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    })

    const result = await getUser()

    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      data: { user: null },
      error: null
    })
  })

  it('should handle authentication errors', async () => {
    const mockError = {
      message: 'Invalid JWT',
      status: 401,
      code: 'invalid_jwt'
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: mockError
    })

    const result = await getUser()

    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      data: { user: null },
      error: mockError
    })
  })

  it('should handle network errors and rejected promises', async () => {
    const networkError = new Error('Network request failed')
    mockSupabaseClient.auth.getUser.mockRejectedValue(networkError)

    await expect(getUser()).rejects.toThrow('Network request failed')
    expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledTimes(1)
  })

  it('should handle expired token errors', async () => {
    const expiredTokenError = {
      message: 'JWT expired',
      status: 401,
      code: 'token_expired'
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: expiredTokenError
    })

    const result = await getUser()

    expect(result.error).toEqual(expiredTokenError)
    expect(result.data.user).toBeNull()
  })

  it('should handle malformed user data gracefully', async () => {
    const malformedUser = {
      id: 'invalid-id-format',
      user_metadata: null
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: malformedUser },
      error: null
    })

    const result = await getUser()

    expect(result.data.user).toEqual(malformedUser)
    expect(result.error).toBeNull()
  })
})

describe('getSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockReturnValue(mockCookieStore as any)
    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as any)

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('should return active session when user is authenticated', async () => {
    const mockSession = {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refresh_token: 'refresh-token-123',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        app_metadata: { provider: 'email' },
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00.000Z'
      }
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    const result = await getSession()

    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      data: { session: mockSession },
      error: null
    })
  })

  it('should return null session when not authenticated', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    const result = await getSession()

    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      data: { session: null },
      error: null
    })
  })

  it('should handle session retrieval errors', async () => {
    const mockError = {
      message: 'Session retrieval failed',
      status: 500,
      code: 'internal_server_error'
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: mockError
    })

    const result = await getSession()

    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      data: { session: null },
      error: mockError
    })
  })

  it('should handle expired sessions', async () => {
    const expiredSession = {
      access_token: 'expired-access-token',
      refresh_token: 'refresh-token-123',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) - 3600,
      token_type: 'bearer',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com'
      }
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: expiredSession },
      error: null
    })

    const result = await getSession()

    expect(result.data.session).toEqual(expiredSession)
    expect(result.data.session.expires_at).toBeLessThan(Math.floor(Date.now() / 1000))
  })

  it('should handle network failures during session retrieval', async () => {
    const networkError = new Error('Failed to fetch session')
    mockSupabaseClient.auth.getSession.mockRejectedValue(networkError)

    await expect(getSession()).rejects.toThrow('Failed to fetch session')
    expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(1)
  })

  it('should handle malformed session data', async () => {
    const malformedSession = {
      access_token: '',
      user: null
    }

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: malformedSession },
      error: null
    })

    const result = await getSession()

    expect(result.data.session).toEqual(malformedSession)
    expect(result.error).toBeNull()
  })
})

describe('Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockReturnValue(mockCookieStore as any)
    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as any)

    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
  })

  it('should handle concurrent user and session requests', async () => {
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com'
    }
    const mockSession = {
      access_token: 'token-123',
      user: mockUser,
      expires_at: Math.floor(Date.now() / 1000) + 3600
    }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    })

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null
    })

    const [userResult, sessionResult] = await Promise.all([
      getUser(),
      getSession()
    ])

    expect(userResult.data.user).toEqual(mockUser)
    expect(sessionResult.data.session).toEqual(mockSession)
    expect(createServerClient).toHaveBeenCalledTimes(2)
  })

  it('should maintain data consistency when user and session data differ', async () => {
    const userFromGetUser = { id: 'user-1', email: 'user1@example.com' }
    const userFromSession = { id: 'user-2', email: 'user2@example.com' }

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: userFromGetUser },
      error: null
    })

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token',
          user: userFromSession,
          expires_at: Math.floor(Date.now() / 1000) + 3600
        }
      },
      error: null
    })

    const [userResult, sessionResult] = await Promise.all([
      getUser(),
      getSession()
    ])

    expect(userResult.data.user.id).toBe('user-1')
    expect(sessionResult.data.session.user.id).toBe('user-2')
  })
})

describe('Edge Cases and Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(cookies).mockReturnValue(mockCookieStore as any)
    vi.mocked(createServerClient).mockReturnValue(mockSupabaseClient as any)
  })

  it('should handle undefined environment variables gracefully', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    expect(() => createClient()).not.toThrow()
    expect(createServerClient).toHaveBeenCalledWith(
      undefined,
      undefined,
      expect.any(Object)
    )
  })

  it('should handle empty string environment variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = ''
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''

    expect(() => createClient()).not.toThrow()
    expect(createServerClient).toHaveBeenCalledWith('', '', expect.any(Object))
  })

  it('should handle malformed cookie values in get operation', () => {
    mockCookieStore.get.mockReturnValue({ value: null })

    createClient()

    const cookieConfig = vi.mocked(createServerClient).mock.calls[0][2]
    const getCookie = cookieConfig.cookies.get

    expect(() => getCookie('test-cookie')).not.toThrow()
    expect(getCookie('test-cookie')).toBeNull()
  })

  it('should handle cookies() throwing an error', () => {
    vi.mocked(cookies).mockImplementation(() => {
      throw new Error('Cannot access cookies in this context')
    })

    expect(() => createClient()).toThrow('Cannot access cookies in this context')
  })

  it('should handle createServerClient throwing an error', () => {
    vi.mocked(createServerClient).mockImplementation(() => {
      throw new Error('Failed to create Supabase client')
    })

    expect(() => createClient()).toThrow('Failed to create Supabase client')
  })

  it('should handle extremely long cookie values', () => {
    const longCookieValue = 'x'.repeat(10000)
    mockCookieStore.get.mockReturnValue({ value: longCookieValue })

    createClient()

    const cookieConfig = vi.mocked(createServerClient).mock.calls[0][2]
    const getCookie = cookieConfig.cookies.get

    expect(getCookie('long-cookie')).toBe(longCookieValue)
  })

  it('should handle special characters in cookie names and values', () => {
    const specialCookieName = 'cookie-with-special-chars-!@#$%'
    const specialCookieValue = 'value-with-special-chars-!@#$%^&*()'

    mockCookieStore.get.mockReturnValue({ value: specialCookieValue })

    createClient()

    const cookieConfig = vi.mocked(createServerClient).mock.calls[0][2]
    const getCookie = cookieConfig.cookies.get

    expect(() => getCookie(specialCookieName)).not.toThrow()
    expect(getCookie(specialCookieName)).toBe(specialCookieValue)
  })
})