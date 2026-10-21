'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatLapTime } from '@/lib/lap-timing'
import {
  LAP_OWNER_HEADER,
  LapSession,
  LapSessionSummary,
  SESSION_PAGE_SIZE,
} from '@/lib/lap-sessions'
import LapList from './LapList'

interface AccountProps {
  userId: string
  onAccountChanged: () => void
}

// Timer repaint state belongs to ActiveSession, so neither history nor its
// cached summaries/details are rebuilt at the timer's 50 ms cadence.
export default function SessionHistory({
  userId,
  onAccountChanged,
  refresh,
}: AccountProps & { refresh: number }) {
  const [history, setHistory] = useState<LapSessionSummary[]>([])
  const [historyError, setHistoryError] = useState('')
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const historyRequest = useRef(0)

  const loadHistory = useCallback(
    async (offset = 0) => {
      const requestId = ++historyRequest.current
      setLoading(true)
      setHistoryError('')
      try {
        const response = await fetch(`/api/lap-sessions?offset=${offset}`, {
          cache: 'no-store',
          headers: { [LAP_OWNER_HEADER]: userId },
        })
        const result = await response.json()
        if (requestId !== historyRequest.current) return
        if (result.code === 'ACCOUNT_CHANGED') {
          onAccountChanged()
          return
        }
        if (!response.ok)
          throw new Error(result.error || 'Unable to load sessions.')
        setHistory((previous) =>
          offset === 0 ? result.data : [...previous, ...result.data],
        )
        setHasMore(result.data.length === SESSION_PAGE_SIZE)
      } catch (error) {
        if (requestId === historyRequest.current)
          setHistoryError(
            error instanceof Error
              ? error.message
              : 'Unable to load sessions. Please retry.',
          )
      } finally {
        if (requestId === historyRequest.current) setLoading(false)
      }
    },
    [userId, onAccountChanged],
  )

  useEffect(() => {
    const requests = historyRequest
    void loadHistory()
    return () => {
      requests.current++
    }
  }, [loadHistory, refresh])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved sessions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p role="status">Loading sessions…</p>}
        {historyError && (
          <div role="alert" className="space-y-2 text-red-700">
            <p>{historyError}</p>
            <Button variant="outline" onClick={() => loadHistory()}>
              Retry history
            </Button>
          </div>
        )}
        {!loading && !historyError && history.length === 0 && (
          <p className="text-slate-600">
            No saved sessions yet. Finish and save your first session above.
          </p>
        )}
        {history.map((session) => (
          <SavedSession
            key={session.id}
            session={session}
            userId={userId}
            onAccountChanged={onAccountChanged}
          />
        ))}
        {hasMore && !historyError && (
          <Button
            variant="outline"
            disabled={loading}
            onClick={() => loadHistory(history.length)}
          >
            Load older sessions
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

const SavedSession = memo(function SavedSession({
  session,
  userId,
  onAccountChanged,
}: AccountProps & { session: LapSessionSummary }) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<LapSession | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!open || detail) return
    const controller = new AbortController()
    async function load() {
      setError('')
      try {
        const response = await fetch(`/api/lap-sessions/${session.id}`, {
          cache: 'no-store',
          headers: { [LAP_OWNER_HEADER]: userId },
          signal: controller.signal,
        })
        const result = await response.json()
        if (controller.signal.aborted) return
        if (result.code === 'ACCOUNT_CHANGED') {
          onAccountChanged()
          return
        }
        if (!response.ok)
          throw new Error(result.error || 'Unable to load lap details.')
        setDetail(result.data)
      } catch (error) {
        if (!controller.signal.aborted)
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to load lap details.',
          )
      }
    }
    void load()
    return () => controller.abort()
  }, [open, detail, attempt, session.id, userId, onAccountChanged])

  return (
    <details
      className="rounded-lg border p-4"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="cursor-pointer space-y-1">
        <span className="font-medium">
          {new Date(session.started_at).toLocaleString()}
        </span>
        <span className="block text-sm text-slate-600">
          {session.lap_count} laps · Average{' '}
          {formatLapTime(
            session.lap_count ? session.completed_ms / session.lap_count : null,
          )}{' '}
          · Active time {formatLapTime(session.elapsed_ms)}
        </span>
      </summary>
      {open && (
        <div className="mt-4">
          {detail ? (
            <LapList laps={detail.laps_ms} />
          ) : error ? (
            <div role="alert">
              <p>{error}</p>
              <Button
                variant="outline"
                onClick={() => setAttempt((value) => value + 1)}
              >
                Retry lap details
              </Button>
            </div>
          ) : (
            <p role="status">Loading lap details…</p>
          )}
        </div>
      )}
    </details>
  )
})
