import { NextRequest, NextResponse } from 'next/server'
import {
  authenticateLapRequest,
  lapResponseHeaders as headers,
} from '@/lib/lap-session-auth'
import {
  parseLapSession,
  sameLapSession,
  SESSION_PAGE_SIZE,
} from '@/lib/lap-sessions'

export const dynamic = 'force-dynamic'
const columns = 'id, started_at, finished_at, elapsed_ms, laps_ms, created_at'
const summaryColumns =
  'id, started_at, finished_at, elapsed_ms, lap_count, completed_ms, created_at'

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateLapRequest(request)
    if (auth.error) return auth.error
    const { supabase, user } = auth

    const offsetParam = request.nextUrl.searchParams.get('offset') ?? '0'
    const offset = Number(offsetParam)
    if (
      !/^\d+$/.test(offsetParam) ||
      !Number.isSafeInteger(offset) ||
      offset > 1000000
    ) {
      return NextResponse.json(
        { error: 'Invalid history offset.' },
        { status: 400, headers },
      )
    }
    const { data, error } = await supabase
      .from('lap_sessions')
      .select(summaryColumns)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .order('id', { ascending: false })
      .range(offset, offset + SESSION_PAGE_SIZE - 1)
    if (error)
      return NextResponse.json(
        { error: 'Unable to load sessions. Please retry.' },
        { status: 500, headers },
      )
    return NextResponse.json({ data }, { headers })
  } catch {
    return NextResponse.json(
      { error: 'Unable to load sessions. Please retry.' },
      { status: 500, headers },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateLapRequest(request)
    if (auth.error) return auth.error
    const { supabase, user } = auth

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON.' },
        { status: 400, headers },
      )
    }
    const session = parseLapSession(body)
    if (!session)
      return NextResponse.json(
        {
          error:
            'Invalid session times or laps (maximum 7 days and 10,000 laps).',
        },
        { status: 400, headers },
      )

    // One row holds the complete immutable session. Concurrent retries use the
    // same (user_id, id) key; DO NOTHING avoids overwriting an earlier save.
    const { error: insertError } = await supabase
      .from('lap_sessions')
      .upsert(
        { ...session, user_id: user.id },
        { onConflict: 'user_id,id', ignoreDuplicates: true },
      )
    if (insertError)
      return NextResponse.json(
        { error: 'Unable to save session. Please retry.' },
        { status: 500, headers },
      )

    const { data, error } = await supabase
      .from('lap_sessions')
      .select(columns)
      .eq('user_id', user.id)
      .eq('id', session.id)
      .single()
    if (error || !data)
      return NextResponse.json(
        { error: 'Unable to confirm save. Please retry.' },
        { status: 500, headers },
      )
    if (!sameLapSession(session, data)) {
      return NextResponse.json(
        {
          error: 'This session ID has already been saved with different times.',
        },
        { status: 409, headers },
      )
    }
    return NextResponse.json({ data }, { headers })
  } catch {
    return NextResponse.json(
      { error: 'Unable to save session. Please retry.' },
      { status: 500, headers },
    )
  }
}
