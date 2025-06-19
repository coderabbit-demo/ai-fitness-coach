import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates and returns a Supabase client configured for browser usage.
 *
 * Uses environment variables to supply the Supabase project URL and anonymous key.
 * @returns A Supabase client instance for interacting with the project's backend from the browser.
 */
export function createClient() {
  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}