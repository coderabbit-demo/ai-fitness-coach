import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateLapRequest,
  lapResponseHeaders as headers,
} from '@/lib/lap-session-auth'
import { isLapSessionId } from '@/lib/lap-sessions'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateLapRequest(request)
    if (auth.error) return auth.error
    const { id } = await params
    if (!isLapSessionId(id))
      return NextResponse.json(
        { error: 'Invalid session ID.' },
        { status: 400, headers },
      )
    const { data, error } = await auth.supabase
      .from('lap_sessions')
      .select('id, started_at, finished_at, elapsed_ms, laps_ms, created_at')
      .eq('user_id', auth.user.id)
      .eq('id', id)
      .maybeSingle()
    if (error)
      return NextResponse.json(
        { error: 'Unable to load lap details. Please retry.' },
        { status: 500, headers },
      )
    if (!data)
      return NextResponse.json(
        { error: 'Session not found.' },
        { status: 404, headers },
      )
    return NextResponse.json({ data }, { headers })
  } catch {
    return NextResponse.json(
      { error: 'Unable to load lap details. Please retry.' },
      { status: 500, headers },
    )
  }
}
