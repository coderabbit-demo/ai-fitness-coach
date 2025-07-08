import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Updates the Supabase session and synchronizes authentication cookies between the incoming Next.js request and the outgoing response.
 *
 * Triggers a Supabase authentication user fetch to refresh the session and ensures any updated cookies are set on the response.
 *
 * @param request - The incoming Next.js request object containing cookies and session information.
 * @returns A NextResponse object with updated authentication cookies reflecting the refreshed session state.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshing the auth token
  await supabase.auth.getUser()

  return supabaseResponse
}