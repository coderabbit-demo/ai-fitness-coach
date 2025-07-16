import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the Supabase authentication session and updates authentication cookies in the Next.js response.
 *
 * Synchronizes authentication cookies between the incoming request and the outgoing response after refreshing the user session.
 *
 * @param request - The incoming Next.js request containing authentication cookies.
 * @returns A NextResponse object with authentication cookies updated to reflect the refreshed session.
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

  // Refresh the auth session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If the request is for a protected route (/app/*) and user is not authenticated
  if (request.nextUrl.pathname.startsWith('/app') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}