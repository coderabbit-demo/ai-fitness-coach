import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates and returns a Supabase client instance configured for server-side usage in a Next.js environment.
 *
 * Throws an error if the required Supabase environment variables are missing.
 * The client is set up to manage user sessions using the current cookie store.
 *
 * @returns A Supabase client instance for server-side operations
 */
export async function createClient() {
  const cookieStore = await cookies()

  // Validate required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please add it to your .env.local file (development) or configure it in your deployment environment (production).'
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable. Please add it to your .env.local file (development) or configure it in your deployment environment (production).'
    )
  }

  // Create a server's supabase client with newly configured cookie,
  // which could be used to maintain user's session
  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}