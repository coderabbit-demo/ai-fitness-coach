import { createClient } from './client';
import { createBrowserClient } from '@supabase/ssr';

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}));

const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>;
const originalEnv = process.env;

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('createClient - Success Cases', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    test('should create client with valid environment variables', () => {
      const mockClient = { auth: {}, from: jest.fn() };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      );
      expect(client).toBe(mockClient);
    });

    test('should call createBrowserClient exactly once', () => {
      mockCreateBrowserClient.mockReturnValue({} as any);

      createClient();

      expect(createBrowserClient).toHaveBeenCalledTimes(1);
    });

    test('should pass environment variables in correct order', () => {
      mockCreateBrowserClient.mockReturnValue({} as any);

      createClient();

      expect(createBrowserClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    });
  });

  describe('createClient - Environment Variable Edge Cases', () => {
    test('should throw error when NEXT_PUBLIC_SUPABASE_URL is undefined', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      expect(() => createClient()).toThrow();
    });

    test('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createClient()).toThrow();
    });

    test('should throw error when both environment variables are undefined', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createClient()).toThrow();
    });

    test('should handle empty string environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      expect(() => createClient()).toThrow();
    });

    test('should handle whitespace-only environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '   ';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      mockCreateBrowserClient.mockReturnValue({} as any);

      expect(() => createClient()).not.toThrow();
      expect(createBrowserClient).toHaveBeenCalledWith('   ', 'test-key');
    });
  });

  describe('createClient - URL Format Validation', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    test('should handle valid HTTPS URLs', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co';
      mockCreateBrowserClient.mockReturnValue({} as any);

      expect(() => createClient()).not.toThrow();
      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://myproject.supabase.co',
        'test-anon-key'
      );
    });

    test('should handle localhost URLs for development', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      mockCreateBrowserClient.mockReturnValue({} as any);

      expect(() => createClient()).not.toThrow();
      expect(createBrowserClient).toHaveBeenCalledWith(
        'http://localhost:54321',
        'test-anon-key'
      );
    });

    test('should handle URLs with custom ports', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co:443';
      mockCreateBrowserClient.mockReturnValue({} as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle URLs with trailing slashes', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co/';
      mockCreateBrowserClient.mockReturnValue({} as any);

      createClient();

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://myproject.supabase.co/',
        'test-anon-key'
      );
    });
  });

  describe('createClient - Anon Key Format Validation', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    });

    test('should handle standard JWT-format anon keys', () => {
      const jwtKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzI2ODAwMCwiZXhwIjoxOTU4ODQ0MDAwfQ.test';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = jwtKey;
      mockCreateBrowserClient.mockReturnValue({} as any);

      expect(() => createClient()).not.toThrow();
      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        jwtKey
      );
    });

    test('should handle short development keys', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dev-key-123';
      mockCreateBrowserClient.mockReturnValue({} as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle keys with special characters', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key-with-dashes_and_underscores.and.dots';
      mockCreateBrowserClient.mockReturnValue({} as any);

      expect(() => createClient()).not.toThrow();
    });
  });

  describe('createClient - createBrowserClient Integration', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    test('should handle createBrowserClient throwing an error', () => {
      const error = new Error('Invalid Supabase configuration');
      mockCreateBrowserClient.mockImplementation(() => {
        throw error;
      });

      expect(() => createClient()).toThrow('Invalid Supabase configuration');
    });

    test('should handle createBrowserClient returning null', () => {
      mockCreateBrowserClient.mockReturnValue(null as any);

      const result = createClient();

      expect(result).toBeNull();
    });

    test('should handle createBrowserClient returning undefined', () => {
      mockCreateBrowserClient.mockReturnValue(undefined as any);

      const result = createClient();

      expect(result).toBeUndefined();
    });

    test('should return the exact object from createBrowserClient', () => {
      const mockClient = {
        auth: { signIn: jest.fn(), signOut: jest.fn() },
        from: jest.fn(),
        storage: { from: jest.fn() },
        realtime: { channel: jest.fn() }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const result = createClient();

      expect(result).toStrictEqual(mockClient);
      expect(result).toBe(mockClient);
    });
  });

  describe('createClient - Performance and Memory', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    test('should handle multiple rapid calls without issues', () => {
      mockCreateBrowserClient.mockReturnValue({} as any);

      for (let i = 0; i < 100; i++) {
        expect(() => createClient()).not.toThrow();
      }

      expect(createBrowserClient).toHaveBeenCalledTimes(100);
    });

    test('should not modify environment variables during execution', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      mockCreateBrowserClient.mockReturnValue({} as any);

      createClient();

      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe(originalUrl);
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(originalKey);
    });

    test('should handle concurrent calls', async () => {
      mockCreateBrowserClient.mockReturnValue({} as any);

      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve().then(() => createClient())
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(createBrowserClient).toHaveBeenCalledTimes(10);
    });
  });

  describe('createClient - Type Safety and Return Values', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    test('should return client with expected auth methods', () => {
      const mockClient = {
        auth: {
          signUp: jest.fn(),
          signIn: jest.fn(),
          signOut: jest.fn(),
          getUser: jest.fn(),
          getSession: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(client.auth).toBeDefined();
      expect(typeof client.auth.signUp).toBe('function');
      expect(typeof client.auth.signIn).toBe('function');
      expect(typeof client.auth.signOut).toBe('function');
    });

    test('should return client with database query methods', () => {
      const mockClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn(),
          insert: jest.fn(),
          update: jest.fn(),
          delete: jest.fn()
        })
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(typeof client.from).toBe('function');
      const table = client.from('test');
      expect(typeof table.select).toBe('function');
      expect(typeof table.insert).toBe('function');
      expect(typeof table.update).toBe('function');
      expect(typeof table.delete).toBe('function');
    });

    test('should return client with storage methods', () => {
      const mockClient = {
        storage: {
          from: jest.fn().mockReturnValue({
            upload: jest.fn(),
            download: jest.fn(),
            remove: jest.fn(),
            list: jest.fn()
          })
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(client.storage).toBeDefined();
      expect(typeof client.storage.from).toBe('function');
    });
  });
});
  describe('createClient - Logging and Environment Detection', () => {
    let mockClientLogger: any;
    let mockLogError: any;
    let mockClient: any;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      // Mock the logger functions
      mockClientLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      };
      
      mockLogError = jest.fn();
      
      mockClient = {
        auth: {
          onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
        },
        from: jest.fn()
      };
      
      // Mock the logger imports
      jest.doMock('@/lib/logger', () => ({
        clientLogger: mockClientLogger,
        logError: mockLogError
      }));
      
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
    });

    afterEach(() => {
      jest.dontMock('@/lib/logger');
    });

    test('should log debug information during client creation', () => {
      const { createClient } = require('./client');
      
      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        hasUrl: true,
        hasAnonKey: true,
        urlStartsWith: 'https://test.supabase...',
        keyStartsWith: 'test-anon-...',
        environment: expect.objectContaining({
          nodeEnv: process.env.NODE_ENV,
          isBrowser: expect.any(Boolean)
        })
      }));
    });

    test('should log successful client creation', () => {
      const { createClient } = require('./client');
      
      createClient();

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase client created successfully', expect.objectContaining({
        projectUrl: 'https://test.supabase...',
        timestamp: expect.any(String)
      }));
    });

    test('should log error when URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      const { createClient } = require('./client');

      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
      expect(mockLogError).toHaveBeenCalledWith(
        expect.any(Error),
        'supabase_client_creation'
      );
    });

    test('should log error when anon key is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const { createClient } = require('./client');

      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
      expect(mockLogError).toHaveBeenCalledWith(
        expect.any(Error),
        'supabase_client_creation'
      );
    });

    test('should detect browser environment correctly', () => {
      // Mock window object to simulate browser environment
      const originalWindow = global.window;
      global.window = {} as any;
      
      const { createClient } = require('./client');
      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        environment: expect.objectContaining({
          isBrowser: true
        })
      }));

      // Restore original window
      global.window = originalWindow;
    });

    test('should detect non-browser environment correctly', () => {
      // Ensure window is undefined (Node.js environment)
      const originalWindow = global.window;
      delete (global as any).window;
      
      const { createClient } = require('./client');
      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        environment: expect.objectContaining({
          isBrowser: false
        })
      }));

      // Restore original window
      global.window = originalWindow;
    });

    test('should handle undefined environment variables in logging', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      const { createClient } = require('./client');
      
      expect(() => createClient()).toThrow();
      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        hasUrl: false,
        hasAnonKey: false,
        urlStartsWith: 'undefined',
        keyStartsWith: 'undefined'
      }));
    });

    test('should truncate long URLs and keys in logging', () => {
      const longUrl = 'https://' + 'a'.repeat(100) + '.supabase.co';
      const longKey = 'b'.repeat(100);
      
      process.env.NEXT_PUBLIC_SUPABASE_URL = longUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = longKey;
      
      const { createClient } = require('./client');
      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        urlStartsWith: longUrl.substring(0, 20) + '...',
        keyStartsWith: longKey.substring(0, 10) + '...'
      }));
    });
  });

  describe('createClient - Auth State Change Listeners', () => {
    let mockClientLogger: any;
    let mockClient: any;
    let authStateChangeCallback: any;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      
      mockClientLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      };
      
      mockClient = {
        auth: {
          onAuthStateChange: jest.fn().mockImplementation((callback) => {
            authStateChangeCallback = callback;
            return { data: { subscription: { unsubscribe: jest.fn() } } };
          })
        },
        from: jest.fn()
      };
      
      jest.doMock('@/lib/logger', () => ({
        clientLogger: mockClientLogger,
        logError: jest.fn()
      }));
      
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      // Mock window object to simulate browser environment
      global.window = {} as any;
    });

    afterEach(() => {
      jest.dontMock('@/lib/logger');
      delete (global as any).window;
    });

    test('should set up auth state change listener in browser environment', () => {
      const { createClient } = require('./client');
      
      createClient();

      expect(mockClient.auth.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should not set up auth state change listener in non-browser environment', () => {
      delete (global as any).window;
      
      const { createClient } = require('./client');
      
      createClient();

      expect(mockClient.auth.onAuthStateChange).not.toHaveBeenCalled();
    });

    test('should log SIGNED_IN event correctly', () => {
      const { createClient } = require('./client');
      createClient();

      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: { provider: 'google' }
        },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authStateChangeCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        event: 'SIGNED_IN',
        hasSession: true,
        userId: 'user-123',
        userEmail: 'tes***@example.com',
        expiresAt: mockSession.expires_at,
        tokenType: 'bearer',
        isExpired: false
      }));

      expect(mockClientLogger.info).toHaveBeenCalledWith('User signed in successfully', {
        userId: 'user-123',
        method: 'google'
      });
    });

    test('should log SIGNED_OUT event correctly', () => {
      const { createClient } = require('./client');
      createClient();

      authStateChangeCallback('SIGNED_OUT', null);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        event: 'SIGNED_OUT',
        hasSession: false,
        userId: undefined,
        userEmail: 'unknown'
      }));

      expect(mockClientLogger.info).toHaveBeenCalledWith('User signed out');
    });

    test('should log TOKEN_REFRESHED event correctly', () => {
      const { createClient } = require('./client');
      createClient();

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authStateChangeCallback('TOKEN_REFRESHED', mockSession);

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Auth token refreshed', {
        userId: 'user-123'
      });
    });

    test('should log USER_UPDATED event correctly', () => {
      const { createClient } = require('./client');
      createClient();

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authStateChangeCallback('USER_UPDATED', mockSession);

      expect(mockClientLogger.debug).toHaveBeenCalledWith('User data updated', {
        userId: 'user-123'
      });
    });

    test('should log PASSWORD_RECOVERY event correctly', () => {
      const { createClient } = require('./client');
      createClient();

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authStateChangeCallback('PASSWORD_RECOVERY', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Password recovery initiated', {
        userId: 'user-123'
      });
    });

    test('should log unknown auth events', () => {
      const { createClient } = require('./client');
      createClient();

      authStateChangeCallback('UNKNOWN_EVENT', null);

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Unknown auth event', {
        event: 'UNKNOWN_EVENT'
      });
    });

    test('should handle sessions without user data', () => {
      const { createClient } = require('./client');
      createClient();

      const mockSession = {
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authStateChangeCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        userId: undefined,
        userEmail: 'unknown'
      }));
    });

    test('should handle expired sessions', () => {
      const { createClient } = require('./client');
      createClient();

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Date.now() / 1000 - 3600, // Expired session
        token_type: 'bearer'
      };

      authStateChangeCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        isExpired: true
      }));
    });

    test('should handle sessions without expiration', () => {
      const { createClient } = require('./client');
      createClient();

      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        token_type: 'bearer'
      };

      authStateChangeCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        isExpired: 'unknown'
      }));
    });

    test('should mask email addresses in logs', () => {
      const { createClient } = require('./client');
      createClient();

      const testCases = [
        { email: 'test@example.com', expected: 'tes***@example.com' },
        { email: 'a@b.co', expected: 'a***@b.co' },
        { email: 'verylongemail@example.com', expected: 'ver***@example.com' }
      ];

      testCases.forEach(({ email, expected }) => {
        const mockSession = {
          user: { id: 'user-123', email },
          expires_at: Date.now() / 1000 + 3600,
          token_type: 'bearer'
        };

        authStateChangeCallback('SIGNED_IN', mockSession);

        expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
          userEmail: expected
        }));
      });
    });

    test('should handle auth provider fallback', () => {
      const { createClient } = require('./client');
      createClient();

      const mockSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com'
          // No app_metadata.provider
        },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authStateChangeCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('User signed in successfully', {
        userId: 'user-123',
        method: 'email'
      });
    });
  });

  describe('createClient - Performance and Stress Testing', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      
      jest.doMock('@/lib/logger', () => ({
        clientLogger: {
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn()
        },
        logError: jest.fn()
      }));
    });

    afterEach(() => {
      jest.dontMock('@/lib/logger');
    });

    test('should handle rapid successive calls', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() }, from: jest.fn() };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        createClient();
      }
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(100);
    });

    test('should handle memory-intensive operations', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() }, from: jest.fn() };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      
      // Create multiple clients and store references
      const clients = [];
      for (let i = 0; i < 50; i++) {
        clients.push(createClient());
      }

      expect(clients).toHaveLength(50);
      clients.forEach(client => {
        expect(client).toBeDefined();
        expect(client.auth).toBeDefined();
      });
    });

    test('should handle concurrent async operations', async () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() }, from: jest.fn() };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      
      const promises = Array.from({ length: 20 }, (_, i) => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve(createClient());
          }, Math.random() * 100);
        })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(20);
      results.forEach(client => {
        expect(client).toBeDefined();
      });
    });
  });

  describe('createClient - Error Recovery and Resilience', () => {
    let mockClientLogger: any;
    let mockLogError: any;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      
      mockClientLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      };
      
      mockLogError = jest.fn();
      
      jest.doMock('@/lib/logger', () => ({
        clientLogger: mockClientLogger,
        logError: mockLogError
      }));
    });

    afterEach(() => {
      jest.dontMock('@/lib/logger');
    });

    test('should recover from logging errors', () => {
      mockClientLogger.debug.mockImplementation(() => {
        throw new Error('Logger error');
      });

      const mockClient = { auth: { onAuthStateChange: jest.fn() }, from: jest.fn() };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      
      // Should not throw even if logging fails
      expect(() => createClient()).not.toThrow();
      expect(mockCreateBrowserClient).toHaveBeenCalled();
    });

    test('should handle createBrowserClient returning malformed objects', () => {
      const malformedClient = {
        // Missing auth property
        from: jest.fn()
      };
      
      mockCreateBrowserClient.mockReturnValue(malformedClient as any);
      
      const { createClient } = require('./client');
      
      const client = createClient();
      expect(client).toBe(malformedClient);
    });

    test('should handle auth state change listener setup failures', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn().mockImplementation(() => {
            throw new Error('Auth listener setup failed');
          })
        },
        from: jest.fn()
      };
      
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      global.window = {} as any;
      
      const { createClient } = require('./client');
      
      // Should not throw even if auth listener setup fails
      expect(() => createClient()).not.toThrow();
      
      delete (global as any).window;
    });

    test('should handle environment variable corruption', () => {
      // Set invalid characters in environment variables
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co\x00\x01';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key\x00\x01';
      
      const mockClient = { auth: { onAuthStateChange: jest.fn() }, from: jest.fn() };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      
      expect(() => createClient()).not.toThrow();
      expect(mockCreateBrowserClient).toHaveBeenCalled();
    });
  });

  describe('createClient - Integration with Browser APIs', () => {
    let mockClientLogger: any;
    let originalWindow: any;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      
      mockClientLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      };
      
      jest.doMock('@/lib/logger', () => ({
        clientLogger: mockClientLogger,
        logError: jest.fn()
      }));

      originalWindow = global.window;
    });

    afterEach(() => {
      jest.dontMock('@/lib/logger');
      global.window = originalWindow;
    });

    test('should work with different window objects', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() }, from: jest.fn() };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      // Test with minimal window object
      global.window = {} as any;
      const { createClient } = require('./client');
      
      expect(() => createClient()).not.toThrow();
      expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled();
    });

    test('should handle window with custom properties', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() }, from: jest.fn() };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      // Test with window object that has custom properties
      global.window = {
        customProperty: 'value',
        localStorage: {},
        sessionStorage: {}
      } as any;
      
      const { createClient } = require('./client');
      
      expect(() => createClient()).not.toThrow();
      expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled();
    });

    test('should handle window object with broken properties', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() }, from: jest.fn() };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      // Test with window object that has broken properties
      global.window = {
        get localStorage() {
          throw new Error('localStorage not available');
        }
      } as any;
      
      const { createClient } = require('./client');
      
      expect(() => createClient()).not.toThrow();
      expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });
});