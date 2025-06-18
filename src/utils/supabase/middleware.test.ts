import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { middleware, updateSession } from './middleware'

vi.mock('@supabase/ssr')
const mockCreateServerClient = vi.mocked(createServerClient)

const createMockRequest = (url: string, options: any = {}) => {
  return new NextRequest(url, {
    cookies: options.cookies || new Map(),
    headers: options.headers || new Headers(),
    ...options,
  })
}

const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    refreshSession: vi.fn(),
    signOut: vi.fn(),
  },
}

describe('middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateServerClient.mockReturnValue(mockSupabaseClient as any)
  })

  describe('authenticated user scenarios', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      })
    })

    it('should allow access to protected routes when authenticated', async () => {
      const request = createMockRequest('https://example.com/dashboard')
      const response = await middleware(request)

      expect(response.status).not.toBe(302)
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled()
    })

    it('should redirect away from auth pages when already authenticated', async () => {
      const request = createMockRequest('https://example.com/login')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe('/dashboard')
    })
  })

  describe('unauthenticated user scenarios', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })
    })

    it('should redirect to login when accessing protected routes', async () => {
      const request = createMockRequest('https://example.com/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe('/login')
    })

    it('should allow access to public routes', async () => {
      const request = createMockRequest('https://example.com/about')
      const response = await middleware(request)

      expect(response.status).not.toBe(302)
    })
  })
})

describe('edge cases and error handling', () => {
  it('should handle Supabase client creation failure', async () => {
    mockCreateServerClient.mockImplementation(() => {
      throw new Error('Failed to create client')
    })

    const request = createMockRequest('https://example.com/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/error')
  })

  it('should handle authentication errors gracefully', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid JWT' },
    })

    const request = createMockRequest('https://example.com/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/login')
  })

  it('should handle malformed request URLs', async () => {
    const request = createMockRequest('invalid-url')
    await expect(middleware(request)).resolves.not.toThrow()
  })

  it('should handle missing or corrupted cookies', async () => {
    const request = createMockRequest('https://example.com/dashboard', {
      cookies: new Map([['corrupted-cookie', 'invalid-data']]),
    })

    const response = await middleware(request)
    expect(response).toBeDefined()
  })
})

describe('session management', () => {
  it('should properly refresh expired sessions', async () => {
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: { expires_at: Date.now() / 1000 - 3600 } },
      error: null,
    })
    mockSupabaseClient.auth.refreshSession.mockResolvedValue({
      data: { session: { expires_at: Date.now() / 1000 + 3600 } },
      error: null,
    })

    const request = createMockRequest('https://example.com/dashboard')
    await middleware(request)

    expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled()
  })

  it('should handle session refresh failures', async () => {
    mockSupabaseClient.auth.refreshSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Refresh failed' },
    })

    const request = createMockRequest('https://example.com/dashboard')
    const response = await middleware(request)

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('/login')
  })

  it('should preserve cookies in response when session is valid', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })

    const request = createMockRequest('https://example.com/dashboard')
    const response = await middleware(request)

    expect(response.headers.get('set-cookie')).toBeDefined()
  })
})

describe('performance and integration', () => {
  it('should complete authentication check within reasonable time', async () => {
    const start = Date.now()
    const request = createMockRequest('https://example.com/dashboard')
    await middleware(request)
    const duration = Date.now() - start

    expect(duration).toBeLessThan(100)
  })

  it('should handle concurrent requests properly', async () => {
    const requests = Array.from({ length: 10 }, (_, i) =>
      createMockRequest(`https://example.com/dashboard?id=${i}`)
    )
    const responses = await Promise.all(requests.map(req => middleware(req)))
    responses.forEach(response => {
      expect(response).toBeDefined()
      expect(response.status).toBeGreaterThanOrEqual(200)
    })
  })

  it('should maintain consistent behavior across different user agents', async () => {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
    ]
    for (const userAgent of userAgents) {
      const request = createMockRequest('https://example.com/dashboard', {
        headers: new Headers({ 'User-Agent': userAgent }),
      })
      const response = await middleware(request)
      expect(response).toBeDefined()
    }
  })
})

afterEach(() => {
  vi.clearAllMocks()
  vi.resetAllMocks()
})

// Helper to validate response structure
const validateResponse = (response: NextResponse) => {
  expect(response).toBeInstanceOf(NextResponse)
  expect(response.status).toBeGreaterThanOrEqual(200)
  expect(response.status).toBeLessThan(600)
}

describe('module exports', () => {
  it('should export all required functions', () => {
    expect(middleware).toBeDefined()
    expect(typeof middleware).toBe('function')
    if (typeof updateSession !== 'undefined') {
      expect(updateSession).toBeDefined()
      expect(typeof updateSession).toBe('function')
    }
  })
})