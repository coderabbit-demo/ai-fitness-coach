import { createBrowserClient } from '@supabase/ssr'
import { clientLogger, logError } from '@/lib/logger'

/**
 * Creates and returns a Supabase client configured for browser environments.
 *
 * Reads the Supabase project URL and anonymous key from environment variables, validating their presence. If either variable is missing, an error is thrown. In browser environments, attaches a listener to log detailed authentication state changes for debugging and monitoring purposes.
 *
 * @returns A Supabase client instance for interacting with the project's backend from the browser.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Log environment variable status
  clientLogger.debug('Creating Supabase client', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    urlStartsWith: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'undefined',
    keyStartsWith: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'undefined',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isBrowser: typeof window !== 'undefined'
    }
  })

  if (!supabaseUrl) {
    const error = new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
    logError(error, 'supabase_client_creation')
    throw error
  }

  if (!supabaseAnonKey) {
    const error = new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
    logError(error, 'supabase_client_creation')
    throw error
  }

  // Create a supabase client on the browser with project's credentials
  const client = createBrowserClient(supabaseUrl, supabaseAnonKey)

  // Log successful client creation
  clientLogger.info('Supabase client created successfully', {
    projectUrl: supabaseUrl.substring(0, 20) + '...',
    timestamp: new Date().toISOString()
  })

  // Add auth state change listener for debugging
  if (typeof window !== 'undefined') {
    client.auth.onAuthStateChange((event, session) => {
      clientLogger.info('Supabase auth state changed', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email ? `${session.user.email.substring(0, 3)}***@${session.user.email.split('@')[1]}` : 'unknown',
        expiresAt: session?.expires_at,
        tokenType: session?.token_type,
        isExpired: session?.expires_at ? Date.now() / 1000 > session.expires_at : 'unknown',
        timestamp: new Date().toISOString()
      })

      // Log specific events for debugging
      switch (event) {
        case 'SIGNED_IN':
          clientLogger.info('User signed in successfully', {
            userId: session?.user?.id,
            method: session?.user?.app_metadata?.provider || 'email'
          })
          break
        case 'SIGNED_OUT':
          clientLogger.info('User signed out')
          break
        case 'TOKEN_REFRESHED':
          clientLogger.debug('Auth token refreshed', {
            userId: session?.user?.id
          })
          break
        case 'USER_UPDATED':
          clientLogger.debug('User data updated', {
            userId: session?.user?.id
          })
          break
        case 'PASSWORD_RECOVERY':
          clientLogger.info('Password recovery initiated', {
            userId: session?.user?.id
          })
          break
        default:
          clientLogger.debug('Unknown auth event', { event })
      }
    })
  }

  return client
}