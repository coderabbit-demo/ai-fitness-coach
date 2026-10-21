import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { LAP_OWNER_HEADER } from './lap-sessions'

export const lapResponseHeaders = { 'Cache-Control': 'private, no-store' }

export async function authenticateLapRequest(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return {
      error: NextResponse.json(
        { error: 'Sign in again to access your sessions.' },
        { status: 401, headers: lapResponseHeaders },
      ),
    }
  }
  // This is a continuity check, never an authority to select another owner.
  // A tab opened as A must not read or save using B's newly replaced cookies.
  const expectedUser = request.headers.get(LAP_OWNER_HEADER)
  if (!expectedUser) {
    return {
      error: NextResponse.json(
        { error: 'Reopen the lap tracker to verify your account.' },
        { status: 400, headers: lapResponseHeaders },
      ),
    }
  }
  if (expectedUser !== user.id) {
    return {
      error: NextResponse.json(
        {
          error: 'Your signed-in account changed. Reload the tracker.',
          code: 'ACCOUNT_CHANGED',
        },
        { status: 409, headers: lapResponseHeaders },
      ),
    }
  }
  return { supabase, user }
}
