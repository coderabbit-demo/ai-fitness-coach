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
  describe('Logging Functionality', () => {
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
      
      // Mock the logger module
      jest.doMock('@/lib/logger', () => ({
        clientLogger: mockClientLogger,
        logError: mockLogError
      }));
    });

    afterEach(() => {
      jest.dontMock('@/lib/logger');
    });

    test('should log debug information during client creation', () => {
      const { createClient } = require('./client');
      mockCreateBrowserClient.mockReturnValue({} as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', {
        hasUrl: true,
        hasAnonKey: true,
        urlStartsWith: 'https://test.supabase...',
        keyStartsWith: 'test-key...',
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isBrowser: typeof window !== 'undefined'
        }
      });
    });

    test('should log successful client creation', () => {
      const { createClient } = require('./client');
      mockCreateBrowserClient.mockReturnValue({} as any);

      createClient();

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase client created successfully', {
        projectUrl: 'https://test.supabase...',
        timestamp: expect.any(String)
      });
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

    test('should log environment variables status correctly when missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const { createClient } = require('./client');

      try {
        createClient();
      } catch (error) {
        // Expected to throw
      }

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', {
        hasUrl: false,
        hasAnonKey: false,
        urlStartsWith: 'undefined',
        keyStartsWith: 'undefined',
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isBrowser: typeof window !== 'undefined'
        }
      });
    });

    test('should handle very long URL in logging', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://very-long-supabase-url-that-should-be-truncated.supabase.co';
      const { createClient } = require('./client');
      mockCreateBrowserClient.mockReturnValue({} as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', 
        expect.objectContaining({
          urlStartsWith: 'https://very-long-s...'
        })
      );
    });

    test('should handle very long anon key in logging', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'very-long-anon-key-that-should-be-truncated-in-logs';
      const { createClient } = require('./client');
      mockCreateBrowserClient.mockReturnValue({} as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', 
        expect.objectContaining({
          keyStartsWith: 'very-long-...'
        })
      );
    });
  });

  describe('Auth State Change Listeners', () => {
    let mockClientLogger: any;
    let mockAuthStateChangeCallback: any;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      
      mockClientLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      };
      
      mockAuthStateChangeCallback = jest.fn();
      
      // Mock window object to simulate browser environment
      Object.defineProperty(window, 'window', {
        value: global,
        writable: true
      });
      
      jest.doMock('@/lib/logger', () => ({
        clientLogger: mockClientLogger,
        logError: jest.fn()
      }));
    });

    afterEach(() => {
      jest.dontMock('@/lib/logger');
      delete (global as any).window;
    });

    test('should register auth state change listener in browser environment', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      expect(mockClient.auth.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should not register auth state change listener in non-browser environment', () => {
      delete (global as any).window;
      
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      expect(mockClient.auth.onAuthStateChange).not.toHaveBeenCalled();
    });

    test('should log SIGNED_IN event correctly', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', app_metadata: { provider: 'email' } },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', {
        event: 'SIGNED_IN',
        hasSession: true,
        userId: 'user-123',
        userEmail: 'tes***@example.com',
        expiresAt: mockSession.expires_at,
        tokenType: 'bearer',
        isExpired: false,
        timestamp: expect.any(String)
      });

      expect(mockClientLogger.info).toHaveBeenCalledWith('User signed in successfully', {
        userId: 'user-123',
        method: 'email'
      });
    });

    test('should log SIGNED_OUT event correctly', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      
      authCallback('SIGNED_OUT', null);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', {
        event: 'SIGNED_OUT',
        hasSession: false,
        userId: undefined,
        userEmail: 'unknown',
        expiresAt: undefined,
        tokenType: undefined,
        isExpired: 'unknown',
        timestamp: expect.any(String)
      });

      expect(mockClientLogger.info).toHaveBeenCalledWith('User signed out');
    });

    test('should log TOKEN_REFRESHED event correctly', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authCallback('TOKEN_REFRESHED', mockSession);

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Auth token refreshed', {
        userId: 'user-123'
      });
    });

    test('should log USER_UPDATED event correctly', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authCallback('USER_UPDATED', mockSession);

      expect(mockClientLogger.debug).toHaveBeenCalledWith('User data updated', {
        userId: 'user-123'
      });
    });

    test('should log PASSWORD_RECOVERY event correctly', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authCallback('PASSWORD_RECOVERY', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Password recovery initiated', {
        userId: 'user-123'
      });
    });

    test('should log unknown auth events', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      
      authCallback('UNKNOWN_EVENT', null);

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Unknown auth event', { 
        event: 'UNKNOWN_EVENT' 
      });
    });

    test('should handle session with expired token', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Date.now() / 1000 - 3600, // Expired 1 hour ago
        token_type: 'bearer'
      };

      authCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', 
        expect.objectContaining({
          isExpired: true
        })
      );
    });

    test('should handle session without email', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user-123' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', 
        expect.objectContaining({
          userEmail: 'unknown'
        })
      );
    });

    test('should handle session with different auth providers', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { 
          id: 'user-123', 
          email: 'test@example.com', 
          app_metadata: { provider: 'google' } 
        },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('User signed in successfully', {
        userId: 'user-123',
        method: 'google'
      });
    });

    test('should handle session without app_metadata', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('User signed in successfully', {
        userId: 'user-123',
        method: 'email'
      });
    });
  });

  describe('Browser Environment Detection', () => {
    test('should detect browser environment correctly', () => {
      // Simulate browser environment
      Object.defineProperty(window, 'window', {
        value: global,
        writable: true
      });
      
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled();
      
      delete (global as any).window;
    });

    test('should detect non-browser environment correctly', () => {
      // Ensure window is undefined
      delete (global as any).window;
      
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      expect(mockClient.auth.onAuthStateChange).not.toHaveBeenCalled();
    });
  });

  describe('Email Masking in Logs', () => {
    let mockClientLogger: any;

    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
      
      mockClientLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      };
      
      Object.defineProperty(window, 'window', {
        value: global,
        writable: true
      });
      
      jest.doMock('@/lib/logger', () => ({
        clientLogger: mockClientLogger,
        logError: jest.fn()
      }));
    });

    afterEach(() => {
      jest.dontMock('@/lib/logger');
      delete (global as any).window;
    });

    test('should mask email addresses in logs correctly', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user-123', email: 'testuser@example.com' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', 
        expect.objectContaining({
          userEmail: 'tes***@example.com'
        })
      );
    });

    test('should handle short email addresses', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user-123', email: 'a@b.co' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', 
        expect.objectContaining({
          userEmail: 'a***@b.co'
        })
      );
    });

    test('should handle malformed email addresses', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user-123', email: 'invalid-email' },
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer'
      };

      authCallback('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', 
        expect.objectContaining({
          userEmail: 'unknown'
        })
      );
    });
  });

  describe('Timestamp Handling', () => {
    let mockClientLogger: any;

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
    });

    afterEach(() => {
      jest.dontMock('@/lib/logger');
    });

    test('should include valid ISO timestamp in logs', () => {
      mockCreateBrowserClient.mockReturnValue({} as any);
      
      const { createClient } = require('./client');
      createClient();

      const successCall = mockClientLogger.info.mock.calls.find(
        call => call[0] === 'Supabase client created successfully'
      );
      
      expect(successCall[1].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should include timestamp in auth state change logs', () => {
      Object.defineProperty(window, 'window', {
        value: global,
        writable: true
      });
      
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);
      
      const { createClient } = require('./client');
      createClient();

      const authCallback = mockClient.auth.onAuthStateChange.mock.calls[0][0];
      authCallback('SIGNED_OUT', null);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', 
        expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        })
      );
      
      delete (global as any).window;
    });
  });

  describe('Integration with Real Supabase SSR Client', () => {
    test('should handle createBrowserClient with real-like configuration', () => {
      const mockClient = {
        auth: {
          onAuthStateChange: jest.fn(),
          getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
          getUser: jest.fn().mockResolvedValue({ data: { user: null } })
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            data: [],
            error: null
          })
        }),
        storage: {
          from: jest.fn().mockReturnValue({
            upload: jest.fn(),
            download: jest.fn()
          })
        }
      };
      
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(client).toBe(mockClient);
      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key'
      );
    });
  });
});