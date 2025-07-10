import { createClient } from './client';
import { createBrowserClient } from '@supabase/ssr';
import { clientLogger, logError } from '@/lib/logger';

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
}));

jest.mock('@/lib/logger', () => ({
  clientLogger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
  logError: jest.fn(),
}));

const mockCreateBrowserClient = createBrowserClient as jest.MockedFunction<typeof createBrowserClient>;
const mockClientLogger = clientLogger as jest.Mocked<typeof clientLogger>;
const mockLogError = logError as jest.MockedFunction<typeof logError>;
const originalEnv = process.env;

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
    delete (global as any).window;
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
      const mockClient = { auth: { onAuthStateChange: jest.fn() }, from: jest.fn() };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      );
      expect(client).toBe(mockClient);
    });

    test('should call createBrowserClient exactly once', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(createBrowserClient).toHaveBeenCalledTimes(1);
    });

    test('should pass environment variables in correct order', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(createBrowserClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    });

    test('should create client with production-like environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzI2ODAwMCwiZXhwIjoxOTU4ODQ0MDAwfQ.signature';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://abcdefghijklmnop.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzI2ODAwMCwiZXhwIjoxOTU4ODQ0MDAwfQ.signature'
      );
      expect(client).toBeDefined();
    });

    test('should maintain referential integrity of returned client', () => {
      const mockClient = { 
        auth: { signIn: jest.fn(), onAuthStateChange: jest.fn() }, 
        from: jest.fn(),
        storage: { from: jest.fn() },
        realtime: { channel: jest.fn() }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(client.auth).toBe(mockClient.auth);
      expect(client.from).toBe(mockClient.from);
      expect(client.storage).toBe(mockClient.storage);
      expect(client.realtime).toBe(mockClient.realtime);
    });
  });

  describe('createClient - Logging Functionality', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    test('should log debug information during client creation', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', {
        hasUrl: true,
        hasAnonKey: true,
        urlStartsWith: 'https://test.supabase...',
        keyStartsWith: 'test-anon-...',
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isBrowser: false
        }
      });
    });

    test('should log info message on successful client creation', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase client created successfully', {
        projectUrl: 'https://test.supabase...',
        timestamp: expect.any(String)
      });
    });

    test('should log debug info when environment variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createClient()).toThrow();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', {
        hasUrl: false,
        hasAnonKey: false,
        urlStartsWith: 'undefined',
        keyStartsWith: 'undefined',
        environment: {
          nodeEnv: process.env.NODE_ENV,
          isBrowser: false
        }
      });
    });

    test('should log browser detection correctly in server environment', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        environment: expect.objectContaining({
          isBrowser: false
        })
      }));
    });

    test('should log browser detection correctly in browser environment', () => {
      (global as any).window = { document: {} };
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        environment: expect.objectContaining({
          isBrowser: true
        })
      }));
    });

    test('should handle logging with different NODE_ENV values', () => {
      process.env.NODE_ENV = 'production';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        environment: expect.objectContaining({
          nodeEnv: 'production'
        })
      }));
    });

    test('should mask sensitive information in logs', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://verylongprojectname.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'verylonganonkey123456789';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        urlStartsWith: 'https://verylongproj...',
        keyStartsWith: 'verylongano...'
      }));
    });
  });

  describe('createClient - Environment Variable Edge Cases', () => {
    test('should throw error when NEXT_PUBLIC_SUPABASE_URL is undefined', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    });

    test('should throw error when NEXT_PUBLIC_SUPABASE_ANON_KEY is undefined', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
    });

    test('should throw error when both environment variables are undefined', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    });

    test('should handle empty string environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    });

    test('should handle whitespace-only environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '   ';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
      expect(createBrowserClient).toHaveBeenCalledWith('   ', 'test-key');
    });

    test('should log error when URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      expect(() => createClient()).toThrow();
      expect(mockLogError).toHaveBeenCalledWith(
        expect.any(Error),
        'supabase_client_creation'
      );
    });

    test('should log error when anon key is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createClient()).toThrow();
      expect(mockLogError).toHaveBeenCalledWith(
        expect.any(Error),
        'supabase_client_creation'
      );
    });
  });

  describe('createClient - Auth State Change Listeners', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    test('should not set up auth state change listener in server environment', () => {
      delete (global as any).window;
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockOnAuthStateChange).not.toHaveBeenCalled();
    });

    test('should set up auth state change listener in browser environment', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockOnAuthStateChange).toHaveBeenCalledWith(expect.any(Function));
    });

    test('should handle SIGNED_IN auth event', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      const authStateChangeHandler = mockOnAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com', app_metadata: { provider: 'google' } },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer'
      };

      authStateChangeHandler('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        event: 'SIGNED_IN',
        hasSession: true,
        userId: 'user123',
        userEmail: 'tes***@example.com'
      }));

      expect(mockClientLogger.info).toHaveBeenCalledWith('User signed in successfully', {
        userId: 'user123',
        method: 'google'
      });
    });

    test('should handle SIGNED_OUT auth event', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      const authStateChangeHandler = mockOnAuthStateChange.mock.calls[0][0];
      authStateChangeHandler('SIGNED_OUT', null);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        event: 'SIGNED_OUT',
        hasSession: false
      }));

      expect(mockClientLogger.info).toHaveBeenCalledWith('User signed out');
    });

    test('should handle TOKEN_REFRESHED auth event', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      const authStateChangeHandler = mockOnAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user123' },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer'
      };

      authStateChangeHandler('TOKEN_REFRESHED', mockSession);

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Auth token refreshed', {
        userId: 'user123'
      });
    });

    test('should handle USER_UPDATED auth event', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      const authStateChangeHandler = mockOnAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user123' },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer'
      };

      authStateChangeHandler('USER_UPDATED', mockSession);

      expect(mockClientLogger.debug).toHaveBeenCalledWith('User data updated', {
        userId: 'user123'
      });
    });

    test('should handle PASSWORD_RECOVERY auth event', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      const authStateChangeHandler = mockOnAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user123' },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer'
      };

      authStateChangeHandler('PASSWORD_RECOVERY', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Password recovery initiated', {
        userId: 'user123'
      });
    });

    test('should handle unknown auth events', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      const authStateChangeHandler = mockOnAuthStateChange.mock.calls[0][0];
      authStateChangeHandler('UNKNOWN_EVENT', null);

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Unknown auth event', {
        event: 'UNKNOWN_EVENT'
      });
    });

    test('should handle auth state change with expired session', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      const authStateChangeHandler = mockOnAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user123', email: 'test@example.com' },
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired
        token_type: 'bearer'
      };

      authStateChangeHandler('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        isExpired: true
      }));
    });

    test('should handle auth state change with no email', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      const authStateChangeHandler = mockOnAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user123' },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer'
      };

      authStateChangeHandler('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        userEmail: 'unknown'
      }));
    });

    test('should handle auth state change with no session', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      const authStateChangeHandler = mockOnAuthStateChange.mock.calls[0][0];
      authStateChangeHandler('SIGNED_OUT', null);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        hasSession: false,
        userId: undefined,
        userEmail: 'unknown',
        isExpired: 'unknown'
      }));
    });
  });

  describe('createClient - URL Format Validation', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    });

    test('should handle valid HTTPS URLs', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://myproject.supabase.co',
        'test-anon-key'
      );
    });

    test('should handle localhost URLs for development', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
      expect(createBrowserClient).toHaveBeenCalledWith(
        'http://localhost:54321',
        'test-anon-key'
      );
    });

    test('should handle URLs with custom ports', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co:443';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle URLs with trailing slashes', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co/';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://myproject.supabase.co/',
        'test-anon-key'
      );
    });

    test('should handle URLs with subdomains', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://api.myproject.supabase.co';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle URLs with query parameters', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co?param=value';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle URLs with fragments', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co#fragment';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle self-hosted Supabase URLs', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://supabase.mycompany.com';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle IP addresses', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://192.168.1.100:8000';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle IPv6 addresses', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://[::1]:8000';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });
  });

  describe('createClient - Anon Key Format Validation', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    });

    test('should handle standard JWT-format anon keys', () => {
      const jwtKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MzI2ODAwMCwiZXhwIjoxOTU4ODQ0MDAwfQ.test';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = jwtKey;
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        jwtKey
      );
    });

    test('should handle short development keys', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dev-key-123';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle keys with special characters', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key-with-dashes_and_underscores.and.dots';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle very long keys', () => {
      const longKey = 'a'.repeat(1000);
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = longKey;
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle keys with unicode characters', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key-with-üñíçødé';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle keys with numbers only', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '123456789';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle single character keys', () => {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'a';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

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
        auth: { signIn: jest.fn(), signOut: jest.fn(), onAuthStateChange: jest.fn() },
        from: jest.fn(),
        storage: { from: jest.fn() },
        realtime: { channel: jest.fn() }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const result = createClient();

      expect(result).toStrictEqual(mockClient);
      expect(result).toBe(mockClient);
    });

    test('should handle createBrowserClient throwing network errors', () => {
      const networkError = new Error('Network timeout');
      mockCreateBrowserClient.mockImplementation(() => {
        throw networkError;
      });

      expect(() => createClient()).toThrow('Network timeout');
    });

    test('should handle createBrowserClient throwing authentication errors', () => {
      const authError = new Error('Invalid API key');
      mockCreateBrowserClient.mockImplementation(() => {
        throw authError;
      });

      expect(() => createClient()).toThrow('Invalid API key');
    });

    test('should handle createBrowserClient throwing generic errors', () => {
      const genericError = new Error('Something went wrong');
      mockCreateBrowserClient.mockImplementation(() => {
        throw genericError;
      });

      expect(() => createClient()).toThrow('Something went wrong');
    });
  });

  describe('createClient - Performance and Memory', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    test('should handle multiple rapid calls without issues', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      for (let i = 0; i < 100; i++) {
        expect(() => createClient()).not.toThrow();
      }

      expect(createBrowserClient).toHaveBeenCalledTimes(100);
    });

    test('should not modify environment variables during execution', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(process.env.NEXT_PUBLIC_SUPABASE_URL).toBe(originalUrl);
      expect(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe(originalKey);
    });

    test('should handle concurrent calls', async () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve().then(() => createClient())
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(createBrowserClient).toHaveBeenCalledTimes(10);
    });

    test('should handle memory-intensive operations', () => {
      const largeObject = { auth: { onAuthStateChange: jest.fn() }, data: new Array(10000).fill('test') };
      mockCreateBrowserClient.mockReturnValue(largeObject as any);

      const client = createClient();

      expect(client).toBe(largeObject);
    });

    test('should handle stress testing with rapid successive calls', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        createClient();
      }
      const end = Date.now();

      expect(end - start).toBeLessThan(5000); // Should complete within 5 seconds
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
          getSession: jest.fn(),
          onAuthStateChange: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(client.auth).toBeDefined();
      expect(typeof client.auth.signUp).toBe('function');
      expect(typeof client.auth.signIn).toBe('function');
      expect(typeof client.auth.signOut).toBe('function');
      expect(typeof client.auth.onAuthStateChange).toBe('function');
    });

    test('should return client with database query methods', () => {
      const mockClient = {
        auth: { onAuthStateChange: jest.fn() },
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
        auth: { onAuthStateChange: jest.fn() },
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

    test('should return client with realtime methods', () => {
      const mockClient = {
        auth: { onAuthStateChange: jest.fn() },
        realtime: {
          channel: jest.fn().mockReturnValue({
            on: jest.fn(),
            subscribe: jest.fn(),
            unsubscribe: jest.fn()
          })
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(client.realtime).toBeDefined();
      expect(typeof client.realtime.channel).toBe('function');
    });

    test('should return client with RPC methods', () => {
      const mockClient = {
        auth: { onAuthStateChange: jest.fn() },
        rpc: jest.fn().mockReturnValue({
          then: jest.fn(),
          catch: jest.fn()
        })
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(typeof client.rpc).toBe('function');
    });

    test('should return client with functions methods', () => {
      const mockClient = {
        auth: { onAuthStateChange: jest.fn() },
        functions: {
          invoke: jest.fn()
        }
      };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      const client = createClient();

      expect(client.functions).toBeDefined();
      expect(typeof client.functions.invoke).toBe('function');
    });
  });

  describe('createClient - Error Boundary and Edge Cases', () => {
    test('should handle process.env being undefined', () => {
      const originalProcessEnv = process.env;
      (global as any).process = { env: undefined };

      expect(() => createClient()).toThrow();

      (global as any).process = { env: originalProcessEnv };
    });

    test('should handle corrupted environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '\0\0\0invalid\0\0\0';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle extremely long environment variables', () => {
      const longUrl = 'https://' + 'a'.repeat(10000) + '.supabase.co';
      const longKey = 'b'.repeat(10000);
      
      process.env.NEXT_PUBLIC_SUPABASE_URL = longUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = longKey;

      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle environment variables with newlines', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co\n';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key\n';

      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle environment variables with special JSON characters', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'key"with"quotes';

      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });
  });

  describe('createClient - Browser/Server Environment Detection', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    test('should detect server environment correctly', () => {
      delete (global as any).window;
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        environment: expect.objectContaining({
          isBrowser: false
        })
      }));
    });

    test('should detect browser environment correctly', () => {
      (global as any).window = { document: {}, location: { href: 'https://example.com' } };
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        environment: expect.objectContaining({
          isBrowser: true
        })
      }));
    });

    test('should handle window object being null', () => {
      (global as any).window = null;
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        environment: expect.objectContaining({
          isBrowser: false
        })
      }));
    });

    test('should handle window object with missing properties', () => {
      (global as any).window = {};
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalledWith('Creating Supabase client', expect.objectContaining({
        environment: expect.objectContaining({
          isBrowser: true
        })
      }));
    });
  });

  describe('createClient - Integration with Next.js', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    test('should handle Next.js development environment', () => {
      process.env.NODE_ENV = 'development';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle Next.js production environment', () => {
      process.env.NODE_ENV = 'production';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle Next.js test environment', () => {
      process.env.NODE_ENV = 'test';
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle server-side rendering context', () => {
      (global as any).window = undefined;
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle client-side rendering context', () => {
      (global as any).window = { document: {} };
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();

      delete (global as any).window;
    });
  });

  describe('createClient - Security Considerations', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    test('should not expose sensitive information in errors', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      let errorMessage = '';
      try {
        createClient();
      } catch (error) {
        errorMessage = error.message;
      }

      expect(errorMessage).not.toContain('password');
      expect(errorMessage).not.toContain('secret');
      expect(errorMessage).toBe('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    });

    test('should handle potential injection attacks in environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co;<script>alert("xss")</script>';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should handle SQL injection attempts in environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co'; DROP TABLE users; --";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      expect(() => createClient()).not.toThrow();
    });

    test('should mask sensitive information in auth state logs', () => {
      (global as any).window = { document: {} };
      const mockOnAuthStateChange = jest.fn();
      const mockClient = { auth: { onAuthStateChange: mockOnAuthStateChange } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      const authStateChangeHandler = mockOnAuthStateChange.mock.calls[0][0];
      const mockSession = {
        user: { id: 'user123', email: 'verylongemail@example.com' },
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer'
      };

      authStateChangeHandler('SIGNED_IN', mockSession);

      expect(mockClientLogger.info).toHaveBeenCalledWith('Supabase auth state changed', expect.objectContaining({
        userEmail: 'ver***@example.com'
      }));
    });
  });

  describe('createClient - Mock Behavior Validation', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    });

    test('should ensure mock is called with exact parameters', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockCreateBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-key'
      );
      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
    });

    test('should ensure mock reset works properly', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();
      jest.resetAllMocks();
      createClient();

      expect(mockCreateBrowserClient).toHaveBeenCalledTimes(1);
    });

    test('should validate mock implementation changes', () => {
      const firstClient = { type: 'first', auth: { onAuthStateChange: jest.fn() } };
      const secondClient = { type: 'second', auth: { onAuthStateChange: jest.fn() } };
      
      mockCreateBrowserClient.mockReturnValue(firstClient as any);
      const first = createClient();

      mockCreateBrowserClient.mockReturnValue(secondClient as any);
      const second = createClient();

      expect(first).toEqual(firstClient);
      expect(second).toEqual(secondClient);
    });

    test('should validate logger mocks are called correctly', () => {
      const mockClient = { auth: { onAuthStateChange: jest.fn() } };
      mockCreateBrowserClient.mockReturnValue(mockClient as any);

      createClient();

      expect(mockClientLogger.debug).toHaveBeenCalled();
      expect(mockClientLogger.info).toHaveBeenCalled();
      expect(mockLogError).not.toHaveBeenCalled();
    });
  });

  describe('createClient - Error Handling and Logging Integration', () => {
    test('should log and throw error for missing URL with proper error context', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
      
      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
        }),
        'supabase_client_creation'
      );
    });

    test('should log and throw error for missing anon key with proper error context', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
      
      expect(mockLogError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
        }),
        'supabase_client_creation'
      );
    });

    test('should handle empty string as falsy for URL', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    });

    test('should handle empty string as falsy for anon key', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';

      expect(() => createClient()).toThrow('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
    });
  });
});