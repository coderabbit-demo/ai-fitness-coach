import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient, getSession, getUser } from './server';

jest.mock('@supabase/ssr');
jest.mock('next/headers');
jest.mock('next/server');

const mockCreateServerClient = jest.mocked(createServerClient);
const mockCookies = jest.mocked(cookies);

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

afterEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  // Restore default environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

describe('createClient', () => {
  it('should create a server client with correct configuration', () => {
    const mockCookieStore = { get: jest.fn(), set: jest.fn() };
    mockCookies.mockReturnValue(mockCookieStore as any);

    const mockClient = { from: jest.fn() };
    mockCreateServerClient.mockReturnValue(mockClient as any);

    const client = createClient();

    expect(mockCreateServerClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          get: expect.any(Function),
          set: expect.any(Function),
        }),
      })
    );
    expect(client).toBe(mockClient);
  });

  it('should throw error when SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect(() => createClient()).toThrow();
  });

  it('should throw error when SUPABASE_ANON_KEY is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(() => createClient()).toThrow();
  });
});

describe('getSession', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = { auth: { getSession: jest.fn() } };
    jest.spyOn(require('./server'), 'createClient').mockReturnValue(mockClient);
  });

  it('should return session when user is authenticated', async () => {
    const mockSession = { access_token: 'token', user: { id: '123', email: 'test@example.com' } };
    (mockClient.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const session = await getSession();

    expect(session).toEqual(mockSession);
    expect(mockClient.auth.getSession).toHaveBeenCalledTimes(1);
  });

  it('should return null when no session exists', async () => {
    (mockClient.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const session = await getSession();

    expect(session).toBeNull();
  });

  it('should handle session fetch errors gracefully', async () => {
    const mockError = new Error('Session fetch failed');
    (mockClient.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: mockError,
    });

    const session = await getSession();

    expect(session).toBeNull();
  });
});

describe('getUser', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = { auth: { getUser: jest.fn() } };
    jest.spyOn(require('./server'), 'createClient').mockReturnValue(mockClient);
  });

  it('should return user when authenticated', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    (mockClient.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const user = await getUser();

    expect(user).toEqual(mockUser);
  });

  it('should return null when user fetch fails', async () => {
    (mockClient.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: null },
      error: new Error('User fetch failed'),
    });

    const user = await getUser();

    expect(user).toBeNull();
  });

  it('should handle network errors', async () => {
    (mockClient.auth.getUser as jest.Mock).mockRejectedValue(new Error('Network error'));
    await expect(getUser()).resolves.toBeNull();
  });
});

describe('Server Integration Tests', () => {
  it('should handle complete authentication flow', async () => {
    const mockCookieStore = {
      get: jest.fn().mockReturnValue({ value: 'session-cookie' }),
      set: jest.fn(),
    };
    mockCookies.mockReturnValue(mockCookieStore as any);

    const mockSession = { access_token: 'token', user: { id: '123', email: 'test@example.com' } };
    const mockClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
        getUser: jest.fn().mockResolvedValue({ data: { user: mockSession.user }, error: null }),
      },
    };
    mockCreateServerClient.mockReturnValue(mockClient as any);

    const client = createClient();
    const session = await getSession();
    const user = await getUser();

    expect(client).toBeDefined();
    expect(session).toEqual(mockSession);
    expect(user).toEqual(mockSession.user);
    expect(mockCookieStore.get).toHaveBeenCalled();
  });

  it('should handle unauthenticated state consistently', async () => {
    const mockClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    };
    mockCreateServerClient.mockReturnValue(mockClient as any);

    const session = await getSession();
    const user = await getUser();

    expect(session).toBeNull();
    expect(user).toBeNull();
  });
});

describe('Error Handling and Edge Cases', () => {
  it('should handle malformed environment variables', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-key';
    expect(() => createClient()).toThrow();
  });

  it('should handle cookie store failures gracefully', () => {
    mockCookies.mockImplementation(() => {
      throw new Error('Cookie store unavailable');
    });
    expect(() => createClient()).toThrow('Cookie store unavailable');
  });

  it('should handle concurrent session requests', async () => {
    const mockClient = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { id: 'session' } },
          error: null,
        }),
      },
    };
    jest.spyOn(require('./server'), 'createClient').mockReturnValue(mockClient);

    const sessionPromises = Array(5).fill(null).map(() => getSession());
    const sessions = await Promise.all(sessionPromises);

    expect(sessions).toHaveLength(5);
    sessions.forEach(s => expect(s).toEqual({ id: 'session' }));
  });
});

describe('Performance and Timeout Tests', () => {
  it(
    'should handle slow session retrieval within timeout',
    async () => {
      const mockClient = {
        auth: {
          getSession: jest.fn().mockImplementation(
            () =>
              new Promise(resolve =>
                setTimeout(
                  () =>
                    resolve({
                      data: { session: { id: 'delayed-session' } },
                      error: null,
                    }),
                  100
                )
              )
          ),
        },
      };
      jest.spyOn(require('./server'), 'createClient').mockReturnValue(mockClient);

      const start = Date.now();
      const session = await getSession();
      const end = Date.now();

      expect(session).toEqual({ id: 'delayed-session' });
      expect(end - start).toBeGreaterThanOrEqual(100);
    },
    5000
  );

  it('should handle session timeout gracefully', async () => {
    const mockClient = {
      auth: {
        getSession: jest.fn().mockImplementation(
          () =>
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 1000)
            )
        ),
      },
    };
    jest.spyOn(require('./server'), 'createClient').mockReturnValue(mockClient);

    await expect(getSession()).resolves.toBeNull();
  });
});