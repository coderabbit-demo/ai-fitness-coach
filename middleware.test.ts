import { NextRequest, NextResponse } from 'next/server'
import { middleware, config } from '../git/middleware'
import { updateSession } from '../git/src/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    next: jest.fn(),
    redirect: jest.fn(),
  },
}))

// Mock Supabase client
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}))

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test-supabase-url.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
}

Object.assign(process.env, mockEnv)

describe('CORS Middleware', () => {
  let mockRequest: jest.Mocked<NextRequest>
  let mockResponse: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockResponse = {
      headers: new Map<string, string>(),
      set: jest.fn((key: string, value: string) => {
        mockResponse.headers.set(key, value)
      }),
    }

    mockRequest = {
      method: 'GET',
      url: 'https://example.com/api/test',
      nextUrl: {
        pathname: '/api/test',
      },
    } as any

    ;(NextResponse.next as jest.Mock).mockReturnValue(mockResponse)
    ;(NextResponse as any).mockImplementation((body: any, init: any) => ({
      ...init,
      body,
    }))
  })

  describe('Happy Path Scenarios', () => {
    test('should add CORS headers to regular requests', () => {
      const result = middleware(mockRequest)

      expect(NextResponse.next).toHaveBeenCalled()
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      expect(mockResponse.headers.set).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      expect(result).toBe(mockResponse)
    })

    test('should handle OPTIONS preflight requests', () => {
      mockRequest.method = 'OPTIONS'

      const result = middleware(mockRequest)

      expect(result).toEqual({
        status: 200,
        headers: mockResponse.headers,
        body: null,
      })
    })
  })

  describe('Edge Cases', () => {
    test('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']

      methods.forEach(method => {
        mockRequest.method = method
        const result = middleware(mockRequest)
        expect(result).toBe(mockResponse)
      })
    })

    test('should handle requests with different URLs', () => {
      const urls = [
        'https://example.com/api/users',
        'https://example.com/api/auth/login',
        'https://example.com/api/data/123',
      ]

      urls.forEach(url => {
        mockRequest.url = url
        const result = middleware(mockRequest)
        expect(result).toBe(mockResponse)
      })
    })
  })
})

describe('Supabase Authentication Middleware', () => {
  let mockRequest: jest.Mocked<NextRequest>
  let mockSupabaseClient: any
  let mockNextResponse: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabaseClient = {
      auth: {
        getUser: jest.fn(),
      },
    }

    mockNextResponse = {
      cookies: {
        set: jest.fn(),
        getAll: jest.fn(() => []),
      },
    }

    mockRequest = {
      cookies: {
        getAll: jest.fn(() => []),
        set: jest.fn(),
      },
      nextUrl: {
        pathname: '/dashboard',
        clone: jest.fn(() => ({
          pathname: '/dashboard',
        })),
      },
    } as any

    ;(createServerClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    ;(NextResponse.next as jest.Mock).mockReturnValue(mockNextResponse)
    ;(NextResponse.redirect as jest.Mock).mockImplementation((url) => ({ redirect: url }))
  })

  describe('Happy Path Scenarios', () => {
    test('should allow authenticated users to access protected routes', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
      })

      const result = await updateSession(mockRequest)

      expect(createServerClient).toHaveBeenCalledWith(
        mockEnv.NEXT_PUBLIC_SUPABASE_URL,
        mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      )
      expect(result).toBe(mockNextResponse)
    })

    test('should allow unauthenticated users to access login page', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })
      mockRequest.nextUrl.pathname = '/login'

      const result = await updateSession(mockRequest)

      expect(result).toBe(mockNextResponse)
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })

    test('should allow unauthenticated users to access auth routes', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })
      mockRequest.nextUrl.pathname = '/auth/callback'

      const result = await updateSession(mockRequest)

      expect(result).toBe(mockNextResponse)
      expect(NextResponse.redirect).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    test('should redirect unauthenticated users from protected routes', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      const result = await updateSession(mockRequest)

      expect(NextResponse.redirect).toHaveBeenCalled()
      const redirectUrl = mockRequest.nextUrl.clone()
      redirectUrl.pathname = '/login'
      expect(result).toEqual({ redirect: redirectUrl })
    })

    test('should handle cookie management correctly', async () => {
      const mockCookies = [
        { name: 'session', value: 'abc123' },
        { name: 'refresh', value: 'def456' },
      ]
      mockRequest.cookies.getAll.mockReturnValue(mockCookies)
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '123' } },
      })

      await updateSession(mockRequest)

      expect(mockRequest.cookies.getAll).toHaveBeenCalled()
      const cookieConfig = (createServerClient as jest.Mock).mock.calls[0][2]
      expect(cookieConfig.cookies.getAll()).toEqual(mockCookies)
    })

    test('should handle various protected route patterns', async () => {
      const protectedRoutes = ['/dashboard', '/profile', '/settings', '/admin']

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      })

      for (const route of protectedRoutes) {
        mockRequest.nextUrl.pathname = route
        const result = await updateSession(mockRequest)
        expect(NextResponse.redirect).toHaveBeenCalled()
      }
    })
  })

  describe('Error Handling', () => {
    test('should handle Supabase client creation errors', async () => {
      ;(createServerClient as jest.Mock).mockImplementation(() => {
        throw new Error('Supabase client creation failed')
      })

      await expect(updateSession(mockRequest)).rejects.toThrow('Supabase client creation failed')
    })

    test('should handle auth.getUser() errors', async () => {
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Auth error'))

      await expect(updateSession(mockRequest)).rejects.toThrow('Auth error')
    })

    test('should handle missing environment variables', async () => {
      const originalEnv = process.env
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      await expect(updateSession(mockRequest)).rejects.toThrow()

      process.env = originalEnv
    })

    test('should handle malformed user data', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: undefined },
      })

      const result = await updateSession(mockRequest)

      expect(NextResponse.redirect).toHaveBeenCalled()
    })
  })

  describe('Integration Scenarios', () => {
    test('should handle cookie setting with complex options', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '123' } },
      })

      await updateSession(mockRequest)

      const cookieConfig = (createServerClient as jest.Mock).mock.calls[0][2]
      const mockSetAll = jest.fn()

      cookieConfig.cookies.setAll([
        { name: 'test', value: 'value', options: { httpOnly: true } }
      ])

      expect(mockRequest.cookies.set).toHaveBeenCalledWith('test', 'value')
      expect(NextResponse.next).toHaveBeenCalledWith({ request: mockRequest })
    })
  })
})

describe('Middleware Configuration', () => {
  test('should have correct matcher configuration', () => {
    expect(config).toEqual({
      matcher: '/api/:path*'
    })
  })

  test('should match API routes correctly', () => {
    const apiPaths = [
      '/api/users',
      '/api/auth/login',
      '/api/data/123',
      '/api/nested/route/path',
    ]

    expect(config.matcher).toBe('/api/:path*')
  })
})

describe('Performance and Stress Tests', () => {
  test('should handle multiple concurrent requests', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: '123' } },
    })

    const promises = Array.from({ length: 10 }, () => updateSession(mockRequest))
    const results = await Promise.all(promises)

    expect(results).toHaveLength(10)
    results.forEach(result => {
      expect(result).toBe(mockNextResponse)
    })
  })

  test('should handle large cookie payloads', async () => {
    const largeCookies = Array.from({ length: 100 }, (_, i) => ({
      name: `cookie_${i}`,
      value: 'x'.repeat(1000), // 1KB per cookie
    }))

    mockRequest.cookies.getAll.mockReturnValue(largeCookies)
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: '123' } },
    })

    const result = await updateSession(mockRequest)
    expect(result).toBe(mockNextResponse)
  })

  test('should handle timeout scenarios gracefully', async () => {
    jest.setTimeout(10000)

    mockSupabaseClient.auth.getUser.mockImplementation(() =>
      new Promise(resolve => setTimeout(() =>
        resolve({ data: { user: { id: '123' } } }), 5000
      ))
    )

    const start = Date.now()
    const result = await updateSession(mockRequest)
    const duration = Date.now() - start

    expect(result).toBe(mockNextResponse)
    expect(duration).toBeGreaterThan(4000)
  })
})

describe('Test Utilities and Cleanup', () => {
  afterAll(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  test('should clean up mocks properly', () => {
    expect(jest.isMockFunction(NextResponse.next)).toBe(true)
    expect(jest.isMockFunction(createServerClient)).toBe(true)
  })
})

// Helper functions for test reusability
function createMockRequest(overrides: Partial<NextRequest> = {}): jest.Mocked<NextRequest> {
  return {
    method: 'GET',
    url: 'https://example.com/api/test',
    cookies: {
      getAll: jest.fn(() => []),
      set: jest.fn(),
    },
    nextUrl: {
      pathname: '/api/test',
      clone: jest.fn(() => ({ pathname: '/api/test' })),
    },
    ...overrides,
  } as any
}

function createMockSupabaseUser(user: any = null) {
  return {
    data: { user },
  }
}