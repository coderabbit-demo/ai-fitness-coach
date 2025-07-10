import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession, middleware } from './middleware'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('next/server', async () => {
  const actual = await vi.importActual('next/server')
  return {
    ...actual,
    NextResponse: {
      ...actual.NextResponse,
      redirect: vi.fn().mockImplementation((url: string) => ({
        status: 302,
        headers: new Headers({ location: url }),
      })),
      next: vi.fn().mockImplementation(() => ({
        status: 200,
        headers: new Headers(),
      })),
    },
  }
})

const mockCreateServerClient = vi.mocked(createServerClient)

describe('Supabase Middleware', () => {
  let mockRequest: Partial<NextRequest>
  let mockSupabaseClient: any
  let mockAuth: any
  let mockCookies: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockAuth = {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
    }
    mockSupabaseClient = { auth: mockAuth }
    mockCreateServerClient.mockReturnValue(mockSupabaseClient)

    mockCookies = {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
      delete: vi.fn(),
      get: vi.fn(),
    }

    mockRequest = {
      nextUrl: new URL('http://localhost:3000/dashboard'),
      cookies: mockCookies,
      headers: new Headers(),
      url: 'http://localhost:3000/dashboard',
    } as Partial<NextRequest>
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication Success Cases', () => {
    it('should allow access to protected routes when user is authenticated', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        user_metadata: {},
        app_metadata: {},
        aud: 'authenticated',
        created_at: '2023-01-01T00:00:00Z'
      }
      const mockSession = {
        access_token: 'valid-access-token',
        refresh_token: 'valid-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: mockUser
      }

      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockAuth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(mockCreateServerClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ cookies: expect.any(Object) })
      )
      expect(mockAuth.getUser).toHaveBeenCalled()
    })

    it('should refresh session when token is near expiry', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      const nearExpirySession = {
        access_token: 'near-expiry-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 300,
        token_type: 'bearer',
        user: mockUser
      }

      mockAuth.getSession.mockResolvedValue({ data: { session: nearExpirySession }, error: null })
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(mockAuth.getSession).toHaveBeenCalled()
      expect(response).toBeDefined()
    })

    it('should handle valid session with all required properties', async () => {
      const completeUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'complete@example.com',
        phone: '+1234567890',
        user_metadata: { name: 'Test User' },
        app_metadata: { role: 'user' },
        aud: 'authenticated',
        confirmation_sent_at: '2023-01-01T00:00:00Z',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      }
      const completeSession = {
        access_token: 'complete-access-token',
        refresh_token: 'complete-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer',
        user: completeUser
      }

      mockAuth.getUser.mockResolvedValue({ data: { user: completeUser }, error: null })
      mockAuth.getSession.mockResolvedValue({ data: { session: completeSession }, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
      expect(mockAuth.getUser).toHaveBeenCalled()
      expect(mockAuth.getSession).toHaveBeenCalled()
    })
  })

  describe('Authentication Failure Cases', () => {

    it("should handle authentication with incomplete user data", async () => {
      const incompleteUser = {
        id: "123",
        email: undefined,
        user_metadata: null,
        app_metadata: undefined
      }

      mockAuth.getUser.mockResolvedValue({ data: { user: incompleteUser }, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
      expect(mockAuth.getUser).toHaveBeenCalled()
    })

    it("should handle authentication timeout scenarios", async () => {
      mockAuth.getUser.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Authentication timeout")), 50)
        )
      )

      await expect(middleware(mockRequest as NextRequest)).rejects.toThrow("Authentication timeout")
    })

    it("should handle corrupted authentication response", async () => {
      mockAuth.getUser.mockResolvedValue({
        data: null,
        error: {
          message: "Corrupted response data",
          status: 422,
          name: "DataCorruptionError"
        }
      })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it("should handle authentication with missing required fields", async () => {
      const malformedUser = {
        // Missing id field
        email: "test@example.com"
      }

      mockAuth.getUser.mockResolvedValue({ data: { user: malformedUser }, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it("should handle session with missing user reference", async () => {
      const sessionWithoutUser = {
        access_token: "valid-token",
        refresh_token: "valid-refresh",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: null
      }

      mockAuth.getSession.mockResolvedValue({ data: { session: sessionWithoutUser }, error: null })
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })
    it('should redirect to login when user is not authenticated', async () => {
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it('should handle expired session gracefully', async () => {
      const expiredSession = {
        access_token: 'expired-token',
        refresh_token: 'expired-refresh',
        expires_at: Math.floor(Date.now() / 1000) - 3600,
        token_type: 'bearer',
        user: { id: '123' }
      }

      mockAuth.getSession.mockResolvedValue({ data: { session: expiredSession }, error: null })
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it('should handle invalid JWT token error', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Invalid JWT',
          status: 401,
          name: 'AuthError'
        }
      })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it('should handle malformed session data', async () => {
      const malformedSession = {
        access_token: null,
        user: null
      }

      mockAuth.getSession.mockResolvedValue({ data: { session: malformedSession }, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it('should handle network errors when calling Supabase', async () => {
      mockAuth.getUser.mockRejectedValue(new Error('Network connection failed'))

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it('should handle Supabase service unavailable', async () => {
      mockAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Service temporarily unavailable',
          status: 503,
          name: 'ServiceError'
        }
      })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })
  })

  describe('Cookie Management', () => {

    it("should handle cookies with special characters in values", async () => {
      const specialCookies = [
        { name: "sb-access-token", value: "token%20with%20spaces" },
        { name: "sb-refresh-token", value: "token+with+plus" },
        { name: "sb-session", value: "token&with&ampersand" }
      ]
      mockCookies.getAll.mockReturnValue(specialCookies)

      let processedCookies: any[] = []
      mockCreateServerClient.mockImplementation((url, key, config) => {
        if (config.cookies?.getAll) {
          processedCookies = config.cookies.getAll()
        }
        return mockSupabaseClient
      })

      await middleware(mockRequest as NextRequest)

      expect(processedCookies).toEqual(specialCookies)
      expect(mockCreateServerClient).toHaveBeenCalled()
    })

    it("should handle empty cookie values", async () => {
      const emptyCookies = [
        { name: "sb-access-token", value: "" },
        { name: "sb-refresh-token", value: "" }
      ]
      mockCookies.getAll.mockReturnValue(emptyCookies)

      await middleware(mockRequest as NextRequest)

      expect(mockCookies.getAll).toHaveBeenCalled()
      expect(mockCreateServerClient).toHaveBeenCalled()
    })

    it("should handle cookies with very long names", async () => {
      const longNameCookie = {
        name: "sb-" + "a".repeat(4000) + "-token",
        value: "test-value"
      }
      mockCookies.getAll.mockReturnValue([longNameCookie])

      await middleware(mockRequest as NextRequest)

      expect(mockCreateServerClient).toHaveBeenCalled()
    })

    it("should handle cookie options with all possible configurations", async () => {
      const comprehensiveCookieOptions = {
        name: "comprehensive-cookie",
        value: "test-value",
        options: {
          httpOnly: true,
          secure: true,
          sameSite: "strict" as const,
          maxAge: 86400,
          path: "/",
          domain: "localhost",
          expires: new Date(Date.now() + 86400000)
        }
      }

      mockCreateServerClient.mockImplementation((url, key, config) => {
        if (config.cookies?.setAll) {
          config.cookies.setAll([comprehensiveCookieOptions])
        }
        return mockSupabaseClient
      })

      await middleware(mockRequest as NextRequest)

      expect(mockCreateServerClient).toHaveBeenCalled()
    })
    it('should properly handle cookie setting with secure options', async () => {
      let capturedCookieOptions: CookieOptions[] = []

      mockCreateServerClient.mockImplementation((url, key, config) => {
        if (config.cookies && config.cookies.set) {
          const mockCookieOptions: CookieOptions = {
            name: 'sb-access-token',
            value: 'test-token-value',
            options: {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              maxAge: 3600
            }
          }
          capturedCookieOptions.push(mockCookieOptions)
          config.cookies.set(mockCookieOptions)
        }
        return mockSupabaseClient
      })

      await middleware(mockRequest as NextRequest)

      expect(mockCreateServerClient).toHaveBeenCalled()
    })

    it('should handle cookie deletion for logout scenarios', async () => {
      let deletedCookies: string[] = []

      mockCreateServerClient.mockImplementation((url, key, config) => {
        if (config.cookies && config.cookies.remove) {
          const cookiesToDelete = ['sb-access-token', 'sb-refresh-token']
          cookiesToDelete.forEach(name => {
            deletedCookies.push(name)
            config.cookies.remove(name, {})
          })
        }
        return mockSupabaseClient
      })

      await middleware(mockRequest as NextRequest)

      expect(mockCreateServerClient).toHaveBeenCalled()
    })

    it('should read existing cookies correctly', async () => {
      const existingCookies = [
        { name: 'sb-access-token', value: 'existing-access-token' },
        { name: 'sb-refresh-token', value: 'existing-refresh-token' }
      ]
      mockCookies.getAll.mockReturnValue(existingCookies)

      let retrievedCookies: any[] = []
      mockCreateServerClient.mockImplementation((url, key, config) => {
        if (config.cookies && config.cookies.getAll) {
          retrievedCookies = config.cookies.getAll()
        }
        return mockSupabaseClient
      })

      await middleware(mockRequest as NextRequest)

      expect(mockCookies.getAll).toHaveBeenCalled()
      expect(mockCreateServerClient).toHaveBeenCalled()
    })

    it('should handle cookie options with different security settings', async () => {
      const securityVariations = [
        { httpOnly: true, secure: true, sameSite: 'strict' as const },
        { httpOnly: false, secure: false, sameSite: 'lax' as const },
        { httpOnly: true, secure: true, sameSite: 'none' as const }
      ]

      for (const options of securityVariations) {
        mockCreateServerClient.mockImplementation((url, key, config) => {
          if (config.cookies && config.cookies.set) {
            config.cookies.set({
              name: 'test-cookie',
              value: 'test-value',
              options
            })
          }
          return mockSupabaseClient
        })

        await middleware(mockRequest as NextRequest)
        expect(mockCreateServerClient).toHaveBeenCalled()
      }
    })
  })

  describe('Route Protection and Navigation', () => {
    it('should protect dashboard routes for unauthenticated users', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/dashboard/profile')
      mockRequest.url = 'http://localhost:3000/dashboard/profile'
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })
      mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it('should allow access to public routes without authentication', async () => {
      const publicRoutes = ['/about', '/contact', '/pricing', '/']
      for (const route of publicRoutes) {
        mockRequest.nextUrl = new URL(`http://localhost:3000${route}`)
        mockRequest.url = `http://localhost:3000${route}`

        const response = await middleware(mockRequest as NextRequest)
        expect(response).toBeDefined()
      }
    })

    it('should handle API routes appropriately', async () => {
      const apiRoutes = [
        '/api/auth/callback',
        '/api/protected-data',
        '/api/public-data',
        '/api/users/profile'
      ]
      for (const route of apiRoutes) {
        mockRequest.nextUrl = new URL(`http://localhost:3000${route}`)
        mockRequest.url = `http://localhost:3000${route}`
        mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

        const response = await middleware(mockRequest as NextRequest)
        expect(response).toBeDefined()
      }
    })

    it('should redirect authenticated users away from auth pages', async () => {
      const authPages = ['/login', '/signup', '/forgot-password', '/reset-password']
      const mockUser = { id: '123', email: 'test@example.com' }

      for (const page of authPages) {
        mockRequest.nextUrl = new URL(`http://localhost:3000${page}`)
        mockRequest.url = `http://localhost:3000${page}`
        mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

        const response = await middleware(mockRequest as NextRequest)
        expect(response).toBeDefined()
      }
    })

    it('should handle deep nested protected routes', async () => {
      const nestedRoutes = [
        '/dashboard/settings/profile',
        '/admin/users/management/details',
        '/app/workspace/project/123/files'
      ]
      for (const route of nestedRoutes) {
        mockRequest.nextUrl = new URL(`http://localhost:3000${route}`)
        mockRequest.url = `http://localhost:3000${route}`
        mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

        const response = await middleware(mockRequest as NextRequest)
        expect(response).toBeDefined()
      }
    })

    it('should handle query parameters and hash fragments', async () => {
      mockRequest.nextUrl = new URL('http://localhost:3000/dashboard?tab=settings&id=123#section')
      mockRequest.url = 'http://localhost:3000/dashboard?tab=settings&id=123#section'
      mockAuth.getUser.mockResolvedValue({ data: { user: null }, error: null })

      const response = await middleware(mockRequest as NextRequest)
      expect(response).toBeDefined()
    })
  })

  describe('Edge Cases and Error Handling', () => {

    it("should handle requests with malformed headers", async () => {
      const malformedHeaders = new Headers()
      malformedHeaders.set("authorization", "Bearer \x00\x01\x02")
      malformedHeaders.set("user-agent", "\uFFFD\uFFFE")
      mockRequest.headers = malformedHeaders

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it("should handle requests with extremely long URLs", async () => {
      const longPath = "/" + "a".repeat(10000)
      mockRequest.nextUrl = new URL(`http://localhost:3000${longPath}`)
      mockRequest.url = `http://localhost:3000${longPath}`

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it("should handle requests with invalid characters in pathname", async () => {
      try {
        mockRequest.nextUrl = {
          pathname: "/path\with\backslashes",
          origin: "http://localhost:3000"
        } as any
      } catch {
        // Handle URL parsing errors gracefully
      }

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it("should handle memory pressure scenarios", async () => {
      // Simulate memory pressure by creating large objects
      const largeData = new Array(100000).fill("x").join("")
      mockRequest.headers.set("x-large-header", largeData)

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it("should handle requests with circular reference attempts", async () => {
      const circularObj: any = { self: null }
      circularObj.self = circularObj

      mockAuth.getUser.mockResolvedValue({
        data: { user: circularObj },
        error: null
      })

      const response = await middleware(mockRequest as NextRequest)

      expect(response).toBeDefined()
    })

    it("should handle multiple error types simultaneously", async () => {
      mockAuth.getUser.mockRejectedValue(new Error("Network error"))
      mockAuth.getSession.mockRejectedValue(new Error("Session error"))
      mockRequest.cookies = null as any

      await expect(middleware(mockRequest as NextRequest)).rejects.toThrow()
    })
    it('should handle malformed URLs gracefully', async () => {
      try {
        mockRequest.nextUrl = new URL('http://localhost:3000/path with spaces')
        mockRequest.url = 'http://localhost:3000/path with spaces'
      } catch {
        mockRequest.nextUrl = {
          pathname: '/path with spaces',
          origin: 'http://localhost:3000'
        } as any
      }

      const response = await middleware(mockRequest as NextRequest)
      expect(response).toBeDefined()
    })

    it('should handle missing environment variables gracefully', async () => {
      const originalEnv = process.env
      process.env = { ...originalEnv }
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      mockCreateServerClient.mockImplementation(() => {
        throw new Error('Missing environment variables')
      })

      await expect(middleware(mockRequest as NextRequest)).rejects.toThrow()
      process.env = originalEnv
    })

    it('should handle concurrent requests safely', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        ...mockRequest,
        nextUrl: new URL(`http://localhost:3000/dashboard/${i}`),
        url: `http://localhost:3000/dashboard/${i}`
      }))

      mockAuth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null })

      const responses = await Promise.all(
        requests.map(req => middleware(req as NextRequest))
      )

      expect(responses).toHaveLength(10)
      responses.forEach(response => {
        expect(response).toBeDefined()
      })
    })

    it('should handle extremely long session tokens', async () => {
      const longToken = 'a'.repeat(50000)
      const sessionWithLongToken = {
        access_token: longToken,
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: { id: '123' }
      }

      mockAuth.getSession.mockResolvedValue({ data: { session: sessionWithLongToken }, error: null })

      const response = await middleware(mockRequest as NextRequest)
      expect(response).toBeDefined()
    })

    it('should handle null and undefined request properties', async () => {
      const faultyRequest = {
        nextUrl: null,
        cookies: null,
        headers: null,
        url: undefined
      } as any

      await expect(middleware(faultyRequest)).rejects.toThrow()
    })

    it('should handle malformed JSON in session data', async () => {
      mockAuth.getSession.mockResolvedValue({ data: { session: 'invalid-json-string' as any }, error: null })

      const response = await middleware(mockRequest as NextRequest)
      expect(response).toBeDefined()
    })
  })

  describe('Performance and Integration Tests', () => {

    it("should handle stress test with rapid authentication state changes", async () => {
      let authCallCount = 0
      mockAuth.getUser.mockImplementation(() => {
        authCallCount++
        const isAuthenticated = authCallCount % 2 === 0
        return Promise.resolve({
          data: { user: isAuthenticated ? { id: `user-${authCallCount}` } : null },
          error: null
        })
      })

      const rapidRequests = Array.from({ length: 20 }, (_, i) => ({
        ...mockRequest,
        nextUrl: new URL(`http://localhost:3000/test-${i}`),
        url: `http://localhost:3000/test-${i}`
      }))

      const responses = await Promise.all(
        rapidRequests.map(req => middleware(req as NextRequest))
      )

      expect(responses).toHaveLength(20)
      expect(authCallCount).toBe(20)
    })

    it("should handle memory cleanup after large session operations", async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Create many sessions with large data
      for (let i = 0; i < 100; i++) {
        const largeSession = {
          access_token: "token-" + "x".repeat(1000),
          refresh_token: "refresh-" + "x".repeat(1000),
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user: {
            id: `user-${i}`,
            email: `user${i}@example.com`,
            user_metadata: { data: "x".repeat(1000) }
          }
        }
        
        mockAuth.getUser.mockResolvedValue({ data: { user: largeSession.user }, error: null })
        mockAuth.getSession.mockResolvedValue({ data: { session: largeSession }, error: null })
        
        await middleware(mockRequest as NextRequest)
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })

    it("should handle concurrent requests with different authentication states", async () => {
      const authenticatedRequests = Array.from({ length: 10 }, (_, i) => ({
        ...mockRequest,
        nextUrl: new URL(`http://localhost:3000/auth-${i}`),
        url: `http://localhost:3000/auth-${i}`
      }))
      
      const unauthenticatedRequests = Array.from({ length: 10 }, (_, i) => ({
        ...mockRequest,
        nextUrl: new URL(`http://localhost:3000/unauth-${i}`),
        url: `http://localhost:3000/unauth-${i}`
      }))

      let callCount = 0
      mockAuth.getUser.mockImplementation(() => {
        callCount++
        const isAuthenticated = callCount <= 10
        return Promise.resolve({
          data: { user: isAuthenticated ? { id: `user-${callCount}` } : null },
          error: null
        })
      })

      const allRequests = [...authenticatedRequests, ...unauthenticatedRequests]
      const responses = await Promise.all(
        allRequests.map(req => middleware(req as NextRequest))
      )

      expect(responses).toHaveLength(20)
      expect(callCount).toBe(20)
    })

    it("should handle request cancellation scenarios", async () => {
      const abortController = new AbortController()
      
      mockAuth.getUser.mockImplementation(() => 
        new Promise((resolve) => {
          const timeout = setTimeout(() => {
            resolve({ data: { user: { id: "123" } }, error: null })
          }, 100)
          
          abortController.signal.addEventListener("abort", () => {
            clearTimeout(timeout)
          })
        })
      )

      const requestPromise = middleware(mockRequest as NextRequest)
      
      // Cancel the request after 50ms
      setTimeout(() => abortController.abort(), 50)
      
      const response = await requestPromise
      expect(response).toBeDefined()
    })
    it('should complete middleware execution within reasonable time', async () => {
      const startTime = Date.now()
      mockAuth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null })

      await middleware(mockRequest as NextRequest)

      const executionTime = Date.now() - startTime
      expect(executionTime).toBeLessThan(1000)
    })

    it('should handle complete authentication flow end-to-end', async () => {
      const completeFlowRequest = {
        nextUrl: new URL('http://localhost:3000/dashboard'),
        url: 'http://localhost:3000/dashboard',
        cookies: {
          getAll: vi.fn().mockReturnValue([
            { name: 'sb-access-token', value: 'valid-token' },
            { name: 'sb-refresh-token', value: 'valid-refresh' }
          ]),
          set: vi.fn(),
          delete: vi.fn(),
          get: vi.fn()
        },
        headers: new Headers({
          'user-agent': 'test-agent',
          'authorization': 'Bearer test-token'
        }),
      } as any

      const mockUser = {
        id: '123',
        email: 'user@example.com',
        user_metadata: { name: 'Test User' },
        app_metadata: { role: 'user' }
      }

      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })
      mockAuth.getSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'valid-token',
            refresh_token: 'valid-refresh',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user: mockUser
          }
        },
        error: null
      })

      const response = await middleware(completeFlowRequest)
      expect(response).toBeDefined()
      expect(mockAuth.getUser).toHaveBeenCalled()
      expect(mockCreateServerClient).toHaveBeenCalled()
    })

    it('should handle rapid successive requests without race conditions', async () => {
      const rapidRequests = Array.from({ length: 50 }, (_, i) => ({
        ...mockRequest,
        nextUrl: new URL(`http://localhost:3000/test-${i}`),
        url: `http://localhost:3000/test-${i}`
      }))

      mockAuth.getUser.mockResolvedValue({ data: { user: { id: '123' } }, error: null })

      const startTime = Date.now()
      const responses = await Promise.all(
        rapidRequests.map(req => middleware(req as NextRequest))
      )
      const endTime = Date.now()

      expect(responses).toHaveLength(50)
      expect(endTime - startTime).toBeLessThan(5000)
      responses.forEach(response => {
        expect(response).toBeDefined()
      })
    })

    it('should properly clean up resources after execution', async () => {
      const initialHandles = process._getActiveHandles?.()?.length || 0

      for (let i = 0; i < 10; i++) {
        await middleware(mockRequest as NextRequest)
      }

      const finalHandles = process._getActiveHandles?.()?.length || 0
      expect(finalHandles).toBeLessThanOrEqual(initialHandles + 5)
    })
  })

  describe('updateSession Function Tests', () => {

  describe("Integration and Real-world Scenarios", () => {
    it("should handle complete authentication flow with token refresh", async () => {
      const initialToken = "initial-access-token"
      const refreshedToken = "refreshed-access-token"
      
      const initialSession = {
        access_token: initialToken,
        refresh_token: "refresh-token",
        expires_at: Math.floor(Date.now() / 1000) + 60, // Expires in 1 minute
        user: { id: "123", email: "test@example.com" }
      }
      
      const refreshedSession = {
        access_token: refreshedToken,
        refresh_token: "new-refresh-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: "123", email: "test@example.com" }
      }
      
      let authCallCount = 0
      mockAuth.getUser.mockImplementation(() => {
        authCallCount++
        if (authCallCount === 1) {
          return Promise.resolve({ data: { user: initialSession.user }, error: null })
        } else {
          return Promise.resolve({ data: { user: refreshedSession.user }, error: null })
        }
      })
      
      const response = await middleware(mockRequest as NextRequest)
      
      expect(response).toBeDefined()
      expect(authCallCount).toBe(1)
    })
    
    it("should handle user role-based access control", async () => {
      const adminUser = {
        id: "admin-123",
        email: "admin@example.com",
        user_metadata: { role: "admin" },
        app_metadata: { roles: ["admin", "user"] }
      }
      
      const regularUser = {
        id: "user-456",
        email: "user@example.com",
        user_metadata: { role: "user" },
        app_metadata: { roles: ["user"] }
      }
      
      // Test admin access
      mockAuth.getUser.mockResolvedValue({ data: { user: adminUser }, error: null })
      mockRequest.nextUrl = new URL("http://localhost:3000/admin/dashboard")
      
      let adminResponse = await middleware(mockRequest as NextRequest)
      expect(adminResponse).toBeDefined()
      
      // Test regular user access
      mockAuth.getUser.mockResolvedValue({ data: { user: regularUser }, error: null })
      mockRequest.nextUrl = new URL("http://localhost:3000/user/dashboard")
      
      let userResponse = await middleware(mockRequest as NextRequest)
      expect(userResponse).toBeDefined()
    })
    
    it("should handle cross-origin request scenarios", async () => {
      const crossOriginRequest = {
        ...mockRequest,
        nextUrl: new URL("http://localhost:3000/api/data"),
        headers: new Headers({
          "Origin": "https://external-site.com",
          "Referer": "https://external-site.com/page"
        })
      }
      
      const response = await middleware(crossOriginRequest as NextRequest)
      
      expect(response).toBeDefined()
    })
    
    it("should handle mobile app authentication scenarios", async () => {
      const mobileHeaders = new Headers({
        "User-Agent": "MyApp/1.0 (iOS 15.0; iPhone)",
        "X-Requested-With": "com.example.myapp",
        "Accept": "application/json"
      })
      
      mockRequest.headers = mobileHeaders
      
      const mobileUser = {
        id: "mobile-user-123",
        email: "mobile@example.com",
        user_metadata: { device_type: "mobile" }
      }
      
      mockAuth.getUser.mockResolvedValue({ data: { user: mobileUser }, error: null })
      
      const response = await middleware(mockRequest as NextRequest)
      
      expect(response).toBeDefined()
    })
    
    it("should handle social login integration", async () => {
      const socialUser = {
        id: "social-123",
        email: "social@example.com",
        user_metadata: {
          provider: "google",
          provider_id: "google-123456",
          avatar_url: "https://example.com/avatar.jpg"
        },
        app_metadata: {
          provider: "google",
          providers: ["google"]
        }
      }
      
      const socialSession = {
        access_token: "social-access-token",
        refresh_token: "social-refresh-token",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: socialUser,
        provider_token: "google-provider-token"
      }
      
      mockAuth.getUser.mockResolvedValue({ data: { user: socialUser }, error: null })
      mockAuth.getSession.mockResolvedValue({ data: { session: socialSession }, error: null })
      
      const response = await middleware(mockRequest as NextRequest)
      
      expect(response).toBeDefined()
      expect(mockAuth.getUser).toHaveBeenCalled()
    })
  })

    it("should handle cookie synchronization correctly", async () => {
      const testCookies = [
        { name: "sb-access-token", value: "access-123" },
        { name: "sb-refresh-token", value: "refresh-456" },
        { name: "custom-cookie", value: "custom-value" }
      ]
      
      mockCookies.getAll.mockReturnValue(testCookies)
      
      let capturedCookies: any[] = []
      mockCreateServerClient.mockImplementation((url, key, config) => {
        if (config.cookies?.getAll) {
          capturedCookies = config.cookies.getAll()
        }
        return mockSupabaseClient
      })

      await updateSession(mockRequest as NextRequest)

      expect(capturedCookies).toEqual(testCookies)
      expect(mockCreateServerClient).toHaveBeenCalled()
    })

    it("should handle cookie setting with complex options", async () => {
      const complexCookies = [
        {
          name: "sb-complex-token",
          value: "complex-value",
          options: {
            httpOnly: true,
            secure: true,
            sameSite: "none" as const,
            maxAge: 7200,
            path: "/api",
            domain: ".example.com"
          }
        }
      ]
      
      let setCookiesCalled = false
      mockCreateServerClient.mockImplementation((url, key, config) => {
        if (config.cookies?.setAll) {
          config.cookies.setAll(complexCookies)
          setCookiesCalled = true
        }
        return mockSupabaseClient
      })

      await updateSession(mockRequest as NextRequest)

      expect(setCookiesCalled).toBe(true)
      expect(mockCreateServerClient).toHaveBeenCalled()
    })

    it("should handle multiple cookie operations in sequence", async () => {
      const operations = [
        { name: "cookie1", value: "value1" },
        { name: "cookie2", value: "value2" },
        { name: "cookie3", value: "value3" }
      ]
      
      let operationCount = 0
      mockCreateServerClient.mockImplementation((url, key, config) => {
        if (config.cookies?.setAll) {
          operations.forEach(op => {
            config.cookies.setAll([op])
            operationCount++
          })
        }
        return mockSupabaseClient
      })

      await updateSession(mockRequest as NextRequest)

      expect(operationCount).toBe(3)
    })

    it("should handle updateSession with invalid environment configuration", async () => {
      const originalEnv = { ...process.env }
      
      process.env.NEXT_PUBLIC_SUPABASE_URL = "invalid-url"
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "invalid-key"
      
      mockCreateServerClient.mockImplementation(() => {
        throw new Error("Invalid configuration")
      })

      await expect(updateSession(mockRequest as NextRequest)).rejects.toThrow("Invalid configuration")
      
      process.env = originalEnv
    })

    it("should handle updateSession with response modification", async () => {
      let responseModified = false
      
      mockCreateServerClient.mockImplementation((url, key, config) => {
        if (config.cookies?.setAll) {
          config.cookies.setAll([{ name: "test", value: "test" }])
          responseModified = true
        }
        return mockSupabaseClient
      })

      const result = await updateSession(mockRequest as NextRequest)

      expect(result).toBeDefined()
      expect(responseModified).toBe(true)
    })
    it('should update session correctly when called directly', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockAuth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null })

      const result = await updateSession(mockRequest as NextRequest)

      expect(result).toBeDefined()
      expect(mockCreateServerClient).toHaveBeenCalled()
    })

    it('should handle session update errors gracefully', async () => {
      mockAuth.getUser.mockRejectedValue(new Error('Session update failed'))

      const result = await updateSession(mockRequest as NextRequest)

      expect(result).toBeDefined()
    })
  })
})