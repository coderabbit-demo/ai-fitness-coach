import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Mock the Supabase client creation
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}))

// Import the module under test (adjust path as needed)
import { supabase, createSupabaseClient } from './client'

const mockCreateClient = vi.mocked(createClient)

describe('Supabase Client Tests', () => {
  // Mock client with all major Supabase methods
  const mockSupabaseClient = {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOtp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      refreshSession: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    rangeGt: vi.fn().mockReturnThis(),
    rangeGte: vi.fn().mockReturnThis(),
    rangeLt: vi.fn().mockReturnThis(),
    rangeLte: vi.fn().mockReturnThis(),
    rangeAdjacent: vi.fn().mockReturnThis(),
    overlaps: vi.fn().mockReturnThis(),
    textSearch: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    abortSignal: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    csv: vi.fn(),
    geojson: vi.fn(),
    explain: vi.fn(),
    rollback: vi.fn(),
    returns: vi.fn().mockReturnThis(),
    storage: {
      from: vi.fn().mockReturnThis(),
      upload: vi.fn(),
      download: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      move: vi.fn(),
      copy: vi.fn(),
      createSignedUrl: vi.fn(),
      createSignedUrls: vi.fn(),
      getPublicUrl: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
    rpc: vi.fn(),
    schema: vi.fn().mockReturnThis(),
    channel: vi.fn(),
    getChannels: vi.fn(),
    removeChannel: vi.fn(),
    removeAllChannels: vi.fn(),
  }

  // Environment variables backup
  const originalEnv = process.env

  beforeAll(() => {
    // Set up default environment variables
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test-project.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-123',
    }
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockReturnValue(mockSupabaseClient as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  afterAll(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('Client Initialization', () => {
    it('should create Supabase client with correct URL and key', () => {
      const testUrl = 'https://custom.supabase.co'
      const testKey = 'custom-anon-key'

      process.env.NEXT_PUBLIC_SUPABASE_URL = testUrl
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = testKey

      const client = createSupabaseClient()

      expect(mockCreateClient).toHaveBeenCalledWith(
        testUrl,
        testKey,
        expect.objectContaining({
          auth: expect.objectContaining({
            persistSession: expect.any(Boolean),
            autoRefreshToken: expect.any(Boolean),
          }),
        }),
      )
    })

    it('should throw error when SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

      expect(() => createSupabaseClient()).toThrow()
    })

    it('should throw error when SUPABASE_ANON_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      expect(() => createSupabaseClient()).toThrow()
    })

    it('should throw error when both URL and key are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      expect(() => createSupabaseClient()).toThrow()
    })

    it('should handle empty string environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

      expect(() => createSupabaseClient()).toThrow()
    })

    it('should create client with custom options', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'

      const customOptions = {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'custom_schema',
        },
      }

      const client = createSupabaseClient(customOptions)

      expect(mockCreateClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining(customOptions),
      )
    })
  })

  describe('Authentication Operations', () => {
    describe('Sign Up', () => {
      it('should handle successful email sign up', async () => {
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString(),
        }
        const mockSession = {
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-123',
          user: mockUser,
        }

        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        })

        const result = await supabase.auth.signUp({
          email: 'test@example.com',
          password: 'password123',
        })

        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
        expect(result.data.user).toEqual(mockUser)
        expect(result.data.session).toEqual(mockSession)
        expect(result.error).toBeNull()
      })

      it('should handle sign up with additional user metadata', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: {
              first_name: 'John',
              last_name: 'Doe',
              age: 30,
            },
          },
        }

        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: { id: 'user-123', ...userData }, session: null },
          error: null,
        })

        const result = await supabase.auth.signUp(userData)

        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith(userData)
        expect(result.error).toBeNull()
      })

      it('should handle sign up errors', async () => {
        const mockError = {
          message: 'User already registered',
          status: 422,
        }

        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: null, session: null },
          error: mockError,
        })

        const result = await supabase.auth.signUp({
          email: 'existing@example.com',
          password: 'password123',
        })

        expect(result.data.user).toBeNull()
        expect(result.data.session).toBeNull()
        expect(result.error).toEqual(mockError)
      })

      it('should handle phone sign up', async () => {
        const phoneData = {
          phone: '+1234567890',
          password: 'password123',
        }

        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: { id: 'user-123', phone: '+1234567890' }, session: null },
          error: null,
        })

        const result = await supabase.auth.signUp(phoneData)

        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith(phoneData)
        expect(result.error).toBeNull()
      })
    })

    describe('Sign In', () => {
      it('should handle successful password sign in', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' }
        const mockSession = {
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-123',
          user: mockUser,
        }

        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: { user: mockUser, session: mockSession },
          error: null,
        })

        const result = await supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123',
        })

        expect(result.data.user).toEqual(mockUser)
        expect(result.data.session).toEqual(mockSession)
        expect(result.error).toBeNull()
      })

      it('should handle invalid credentials', async () => {
        const mockError = {
          message: 'Invalid login credentials',
          status: 400,
        }

        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: { user: null, session: null },
          error: mockError,
        })

        const result = await supabase.auth.signInWithPassword({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })

        expect(result.data.user).toBeNull()
        expect(result.error).toEqual(mockError)
      })

      it('should handle OTP sign in', async () => {
        mockSupabaseClient.auth.signInWithOtp.mockResolvedValue({
          data: { user: null, session: null },
          error: null,
        })

        const result = await supabase.auth.signInWithOtp({
          email: 'test@example.com',
        })

        expect(mockSupabaseClient.auth.signInWithOtp).toHaveBeenCalledWith({
          email: 'test@example.com',
        })
        expect(result.error).toBeNull()
      })

      it('should handle OAuth sign in', async () => {
        mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
          data: { provider: 'google', url: 'https://oauth-url.com' },
          error: null,
        })

        const result = await supabase.auth.signInWithOAuth({
          provider: 'google',
        })

        expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
        })
        expect(result.error).toBeNull()
      })
    })

    describe('Session Management', () => {
      it('should get current session successfully', async () => {
        const mockSession = {
          access_token: 'token-123',
          refresh_token: 'refresh-123',
          user: { id: 'user-123' },
        }

        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: mockSession },
          error: null,
        })

        const result = await supabase.auth.getSession()

        expect(result.data.session).toEqual(mockSession)
        expect(result.error).toBeNull()
      })

      it('should handle no active session', async () => {
        mockSupabaseClient.auth.getSession.mockResolvedValue({
          data: { session: null },
          error: null,
        })

        const result = await supabase.auth.getSession()

        expect(result.data.session).toBeNull()
        expect(result.error).toBeNull()
      })

      it('should refresh session successfully', async () => {
        const newSession = {
          access_token: 'new-token-123',
          refresh_token: 'new-refresh-123',
          user: { id: 'user-123' },
        }

        mockSupabaseClient.auth.refreshSession.mockResolvedValue({
          data: { session: newSession, user: newSession.user },
          error: null,
        })

        const result = await supabase.auth.refreshSession()

        expect(result.data.session).toEqual(newSession)
        expect(result.error).toBeNull()
      })

      it('should handle auth state changes', () => {
        const mockCallback = vi.fn()
        const mockUnsubscribe = vi.fn()

        mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
          data: { subscription: { unsubscribe: mockUnsubscribe } },
        })

        const { data } = supabase.auth.onAuthStateChange(mockCallback)

        expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback)
        expect(data.subscription.unsubscribe).toBeDefined()
      })
    })

    describe('User Management', () => {
      it('should get current user', async () => {
        const mockUser = { id: 'user-123', email: 'test@example.com' }

        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null,
        })

        const result = await supabase.auth.getUser()

        expect(result.data.user).toEqual(mockUser)
        expect(result.error).toBeNull()
      })

      it('should update user successfully', async () => {
        const updateData = {
          email: 'newemail@example.com',
          password: 'newpassword123',
          data: { first_name: 'Jane' },
        }
        const updatedUser = { id: 'user-123', ...updateData }

        mockSupabaseClient.auth.updateUser.mockResolvedValue({
          data: { user: updatedUser },
          error: null,
        })

        const result = await supabase.auth.updateUser(updateData)

        expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith(updateData)
        expect(result.data.user).toEqual(updatedUser)
        expect(result.error).toBeNull()
      })

      it('should handle sign out', async () => {
        mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null })

        const result = await supabase.auth.signOut()

        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1)
        expect(result.error).toBeNull()
      })

      it('should handle password reset', async () => {
        mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
          data: {},
          error: null,
        })

        const result = await supabase.auth.resetPasswordForEmail('test@example.com')

        expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com')
        expect(result.error).toBeNull()
      })
    })
  })

  describe('Database Operations', () => {
    describe('Select Operations', () => {
      it('should perform basic select query', async () => {
        const mockData = [
          { id: 1, name: 'Item 1', status: 'active' },
          { id: 2, name: 'Item 2', status: 'inactive' },
        ]

        mockSupabaseClient.then = vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        })

        const result = await supabase
          .from('items')
          .select('*')

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('items')
        expect(mockSupabaseClient.select).toHaveBeenCalledWith('*')
      })

      it('should select specific columns', async () => {
        mockSupabaseClient.then = vi.fn().mockResolvedValue({
          data: [{ id: 1, name: 'Item 1' }],
          error: null,
        })

        await supabase
          .from('items')
          .select('id, name')

        expect(mockSupabaseClient.select).toHaveBeenCalledWith('id, name')
      })

      it('should handle single record selection', async () => {
        const mockItem = { id: 1, name: 'Single Item' }

        mockSupabaseClient.single.mockResolvedValue({
          data: mockItem,
          error: null,
        })

        const result = await supabase
          .from('items')
          .select('*')
          .eq('id', 1)
          .single()

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 1)
        expect(mockSupabaseClient.single).toHaveBeenCalled()
        expect(result.data).toEqual(mockItem)
      })

      it('should handle maybeSingle for optional records', async () => {
        mockSupabaseClient.maybeSingle.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await supabase
          .from('items')
          .select('*')
          .eq('id', 999)
          .maybeSingle()

        expect(mockSupabaseClient.maybeSingle).toHaveBeenCalled()
        expect(result.data).toBeNull()
      })
    })

    describe('Filter Operations', () => {
      it('should apply equality filter', async () => {
        await supabase
          .from('items')
          .select('*')
          .eq('status', 'active')

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active')
      })

      it('should apply multiple filters', async () => {
        await supabase
          .from('items')
          .select('*')
          .eq('status', 'active')
          .gt('created_at', '2023-01-01')
          .like('name', '%test%')

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'active')
        expect(mockSupabaseClient.gt).toHaveBeenCalledWith('created_at', '2023-01-01')
        expect(mockSupabaseClient.like).toHaveBeenCalledWith('name', '%test%')
      })

      it('should apply IN filter', async () => {
        await supabase
          .from('items')
          .select('*')
          .in('status', ['active', 'pending'])

        expect(mockSupabaseClient.in).toHaveBeenCalledWith('status', ['active', 'pending'])
      })

      it('should apply OR filter', async () => {
        await supabase
          .from('items')
          .select('*')
          .or('status.eq.active,status.eq.pending')

        expect(mockSupabaseClient.or).toHaveBeenCalledWith('status.eq.active,status.eq.pending')
      })

      it('should apply NOT filter', async () => {
        await supabase
          .from('items')
          .select('*')
          .not('status', 'eq', 'deleted')

        expect(mockSupabaseClient.not).toHaveBeenCalledWith('status', 'eq', 'deleted')
      })
    })

    describe('Insert Operations', () => {
      it('should insert single record', async () => {
        const newItem = { name: 'New Item', status: 'active' }
        const insertedItem = { id: 1, ...newItem }

        mockSupabaseClient.single.mockResolvedValue({
          data: insertedItem,
          error: null,
        })

        const result = await supabase
          .from('items')
          .insert(newItem)
          .single()

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith(newItem)
        expect(result.data).toEqual(insertedItem)
      })

      it('should insert multiple records', async () => {
        const newItems = [
          { name: 'Item 1', status: 'active' },
          { name: 'Item 2', status: 'pending' },
        ]

        mockSupabaseClient.then = vi.fn().mockResolvedValue({
          data: newItems.map((item, i) => ({ id: i + 1, ...item })),
          error: null,
        })

        await supabase
          .from('items')
          .insert(newItems)

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith(newItems)
      })

      it('should handle insert errors', async () => {
        const mockError = {
          message: 'duplicate key value violates unique constraint',
          code: '23505',
        }

        mockSupabaseClient.single.mockResolvedValue({
          data: null,
          error: mockError,
        })

        const result = await supabase
          .from('items')
          .insert({ name: 'Duplicate' })
          .single()

        expect(result.data).toBeNull()
        expect(result.error).toEqual(mockError)
      })
    })

    describe('Update Operations', () => {
      it('should update records with filter', async () => {
        const updateData = { status: 'completed' }
        const updatedItems = [{ id: 1, name: 'Item 1', status: 'completed' }]

        mockSupabaseClient.then = vi.fn().mockResolvedValue({
          data: updatedItems,
          error: null,
        })

        await supabase
          .from('items')
          .update(updateData)
          .eq('id', 1)

        expect(mockSupabaseClient.update).toHaveBeenCalledWith(updateData)
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 1)
      })

      it('should handle update with no matching records', async () => {
        mockSupabaseClient.then = vi.fn().mockResolvedValue({
          data: [],
          error: null,
        })

        const result = await supabase
          .from('items')
          .update({ status: 'deleted' })
          .eq('id', 999)

        expect(result.data).toEqual([])
      })
    })

    describe('Delete Operations', () => {
      it('should delete records with filter', async () => {
        mockSupabaseClient.then = vi.fn().mockResolvedValue({
          data: [{ id: 1 }],
          error: null,
        })

        await supabase
          .from('items')
          .delete()
          .eq('id', 1)

        expect(mockSupabaseClient.delete).toHaveBeenCalled()
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 1)
      })

      it('should handle cascade delete errors', async () => {
        const mockError = {
          message: 'foreign key constraint violation',
          code: '23503',
        }

        mockSupabaseClient.then = vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        })

        const result = await supabase
          .from('items')
          .delete()
          .eq('id', 1)

        expect(result.error).toEqual(mockError)
      })
    })

    describe('Upsert Operations', () => {
      it('should upsert single record', async () => {
        const upsertData = { id: 1, name: 'Updated Item', status: 'active' }

        mockSupabaseClient.single.mockResolvedValue({
          data: upsertData,
          error: null,
        })

        const result = await supabase
          .from('items')
          .upsert(upsertData)
          .single()

        expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(upsertData)
        expect(result.data).toEqual(upsertData)
      })

      it('should upsert with conflict resolution', async () => {
        const upsertData = { email: 'test@example.com', name: 'Test User' }

        mockSupabaseClient.single.mockResolvedValue({
          data: upsertData,
          error: null,
        })

        await supabase
          .from('users')
          .upsert(upsertData, { onConflict: 'email' })
          .single()

        expect(mockSupabaseClient.upsert).toHaveBeenCalledWith(upsertData, { onConflict: 'email' })
      })
    })
  })

  describe('Storage Operations', () => {
    describe('File Upload', () => {
      it('should upload file successfully', async () => {
        const mockFile = new File(['file content'], 'test.txt', { type: 'text/plain' })
        const mockResponse = {
          data: {
            path: 'uploads/test.txt',
            id: 'file-123',
            fullPath: 'bucket/uploads/test.txt',
          },
          error: null,
        }

        mockSupabaseClient.storage.from().upload.mockResolvedValue(mockResponse)

        const result = await supabase.storage
          .from('uploads')
          .upload('test.txt', mockFile)

        expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('uploads')
        expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith('test.txt', mockFile)
        expect(result.data).toEqual(mockResponse.data)
      })

      it('should upload with options', async () => {
        const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
        const options = {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg',
        }

        mockSupabaseClient.storage.from().upload.mockResolvedValue({
          data: { path: 'images/test.jpg' },
          error: null,
        })

        await supabase.storage
          .from('images')
          .upload('test.jpg', mockFile, options)

        expect(mockSupabaseClient.storage.from().upload).toHaveBeenCalledWith('test.jpg', mockFile, options)
      })

      it('should handle upload errors', async () => {
        const mockFile = new File(['content'], 'test.txt')
        const mockError = {
          message: 'File too large',
          statusCode: '413',
        }

        mockSupabaseClient.storage.from().upload.mockResolvedValue({
          data: null,
          error: mockError,
        })

        const result = await supabase.storage
          .from('uploads')
          .upload('large-file.txt', mockFile)

        expect(result.error).toEqual(mockError)
      })
    })

    describe('File Download', () => {
      it('should download file successfully', async () => {
        const mockBlob = new Blob(['file content'], { type: 'text/plain' })

        mockSupabaseClient.storage.from().download.mockResolvedValue({
          data: mockBlob,
          error: null,
        })

        const result = await supabase.storage
          .from('uploads')
          .download('test.txt')

        expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('uploads')
        expect(mockSupabaseClient.storage.from().download).toHaveBeenCalledWith('test.txt')
        expect(result.data).toEqual(mockBlob)
      })

      it('should handle file not found', async () => {
        const mockError = {
          message: 'Object not found',
          statusCode: '404',
        }

        mockSupabaseClient.storage.from().download.mockResolvedValue({
          data: null,
          error: mockError,
        })

        const result = await supabase.storage
          .from('uploads')
          .download('nonexistent.txt')

        expect(result.error).toEqual(mockError)
      })
    })

    describe('File Management', () => {
      it('should list files in bucket', async () => {
        const mockFiles = [
          { name: 'file1.txt', id: '1', updated_at: '2023-01-01T00:00:00Z' },
          { name: 'file2.txt', id: '2', updated_at: '2023-01-02T00:00:00Z' },
        ]

        mockSupabaseClient.storage.from().list.mockResolvedValue({
          data: mockFiles,
          error: null,
        })

        const result = await supabase.storage
          .from('uploads')
          .list()

        expect(result.data).toEqual(mockFiles)
      })

      it('should remove files', async () => {
        const filesToRemove = ['file1.txt', 'file2.txt']

        mockSupabaseClient.storage.from().remove.mockResolvedValue({
          data: filesToRemove.map(name => ({ name })),
          error: null,
        })

        const result = await supabase.storage
          .from('uploads')
          .remove(filesToRemove)

        expect(mockSupabaseClient.storage.from().remove).toHaveBeenCalledWith(filesToRemove)
        expect(result.error).toBeNull()
      })

      it('should create signed URL', () => {
        const mockSignedUrl = 'https://signed-url.com/test.txt?token=abc123'

        mockSupabaseClient.storage.from().createSignedUrl.mockResolvedValue({
          data: { signedUrl: mockSignedUrl },
          error: null,
        })

        const result = await supabase.storage
          .from('uploads')
          .createSignedUrl('test.txt', 3600)

        expect(mockSupabaseClient.storage.from().createSignedUrl).toHaveBeenCalledWith('test.txt', 3600)
        expect(result.data.signedUrl).toEqual(mockSignedUrl)
      })

      it('should get public URL', () => {
        const mockPublicUrl = 'https://public-url.com/test.txt'

        mockSupabaseClient.storage.from().getPublicUrl.mockReturnValue({
          data: { publicUrl: mockPublicUrl },
        })

        const result = supabase.storage
          .from('uploads')
          .getPublicUrl('test.txt')

        expect(result.data.publicUrl).toEqual(mockPublicUrl)
      })
    })
  })

  describe('Advanced Features', () => {
    describe('RPC Functions', () => {
      it('should call RPC function successfully', async () => {
        const mockResult = { sum: 15, count: 5 }

        mockSupabaseClient.rpc.mockResolvedValue({
          data: mockResult,
          error: null,
        })

        const result = await supabase.rpc('calculate_sum', {
          values: [1, 2, 3, 4, 5],
        })

        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('calculate_sum', {
          values: [1, 2, 3, 4, 5],
        })
        expect(result.data).toEqual(mockResult)
      })

      it('should handle RPC function errors', async () => {
        const mockError = {
          message: 'Function not found',
          code: 'PGRST202',
        }

        mockSupabaseClient.rpc.mockResolvedValue({
          data: null,
          error: mockError,
        })

        const result = await supabase.rpc('nonexistent_function')

        expect(result.error).toEqual(mockError)
      })
    })

    describe('Edge Functions', () => {
      it('should invoke edge function successfully', async () => {
        const mockResponse = { message: 'Function executed successfully' }

        mockSupabaseClient.functions.invoke.mockResolvedValue({
          data: mockResponse,
          error: null,
        })

        const result = await supabase.functions.invoke('hello-world', {
          body: { name: 'Test' },
        })

        expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('hello-world', {
          body: { name: 'Test' },
        })
        expect(result.data).toEqual(mockResponse)
      })

      it('should handle edge function timeout', async () => {
        const mockError = {
          message: 'Function timeout',
          status: 408,
        }

        mockSupabaseClient.functions.invoke.mockResolvedValue({
          data: null,
          error: mockError,
        })

        const result = await supabase.functions.invoke('slow-function')

        expect(result.error).toEqual(mockError)
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle network failures gracefully', async () => {
      const networkError = new Error('Network request failed')
      mockSupabaseClient.single.mockRejectedValue(networkError)

      await expect(
        supabase.from('items').select('*').single()
      ).rejects.toThrow('Network request failed')
    })

    it('should handle malformed responses', async () => {
      mockSupabaseClient.then = vi.fn().mockResolvedValue({
        data: undefined,
        error: { message: 'Malformed response', code: 'INVALID_RESPONSE' },
      })

      const result = await supabase.from('items').select('*')

      expect(result.data).toBeUndefined()
      expect(result.error.message).toBe('Malformed response')
    })

    it('should handle empty query results gracefully', async () => {
      mockSupabaseClient.then = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await supabase.from('items').select('*')

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })

    it('should handle concurrent operations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) => {
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: { id: i + 1, name: `Item ${i + 1}` },
          error: null,
        })

        return supabase.from('items').select('*').eq('id', i + 1).single()
      })

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result, i) => {
        expect(result.data.id).toBe(i + 1)
        expect(result.error).toBeNull()
      })
    })

    it('should handle rate limiting', async () => {
      const rateLimitError = {
        message: 'Too many requests',
        status: 429,
      }

      mockSupabaseClient.then = vi.fn().mockResolvedValue({
        data: null,
        error: rateLimitError,
      })

      const result = await supabase.from('items').select('*')

      expect(result.error).toEqual(rateLimitError)
    })
  })
})