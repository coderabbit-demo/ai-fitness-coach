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