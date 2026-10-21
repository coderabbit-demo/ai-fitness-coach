'use client'

import Link from 'next/link'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  averageLapTime,
  currentLapTime,
  elapsedTime,
  emptyTimer,
  formatLapTime,
  lapTimerReducer,
} from '@/lib/lap-timing'
import {
  LapSession,
  LapSessionInput,
  MAX_LAPS,
  SESSION_PAGE_SIZE,
} from '@/lib/lap-sessions'

export default function LapTracker() {
  const [timer, dispatch] = useReducer(lapTimerReducer, emptyTimer)
  const [now, setNow] = useState(0)
  const sessionMeta = useRef({ id: '', started_at: '', finished_at: '' })
  const [saveStatus, setSaveStatus] = useState<'unsaved' | 'saving' | 'saved'>(
    'unsaved',
  )
  const saving = useRef(false)
  const [saveError, setSaveError] = useState('')
  const [history, setHistory] = useState<LapSession[]>([])
  const [historyError, setHistoryError] = useState('')
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const historyRequest = useRef(0)

  const loadHistory = useCallback(async (offset = 0) => {
    const requestId = ++historyRequest.current
    setLoading(true)
    setHistoryError('')
    try {
      const response = await fetch(`/api/lap-sessions?offset=${offset}`, {
        cache: 'no-store',
      })
      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || 'Unable to load sessions.')
      if (requestId !== historyRequest.current) return
      setHistory((previous) =>
        offset === 0 ? result.data : [...previous, ...result.data],
      )
      setHasMore(result.data.length === SESSION_PAGE_SIZE)
    } catch (error) {
      if (requestId === historyRequest.current) {
        setHistoryError(
          error instanceof Error
            ? error.message
            : 'Unable to load sessions. Please retry.',
        )
      }
    } finally {
      if (requestId === historyRequest.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const requests = historyRequest
    void loadHistory()
    return () => {
      requests.current++
    }
  }, [loadHistory])

  useEffect(() => {
    if (timer.status !== 'running') return
    const repaint = () => setNow(performance.now())
    const interval = window.setInterval(repaint, 50)
    document.addEventListener('visibilitychange', repaint)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', repaint)
    }
  }, [timer.status])

  const unsaved = timer.status !== 'idle' && saveStatus !== 'saved'
  useEffect(() => {
    if (!unsaved) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [unsaved])

  function start() {
    sessionMeta.current = {
      id: crypto.randomUUID(),
      started_at: new Date().toISOString(),
      finished_at: '',
    }
    setSaveStatus('unsaved')
    setSaveError('')
    const timestamp = performance.now()
    setNow(timestamp)
    dispatch({ type: 'start', now: timestamp })
  }

  function act(type: 'lap' | 'pause' | 'resume' | 'finish') {
    const timestamp = performance.now()
    setNow(timestamp)
    if (type === 'finish')
      sessionMeta.current.finished_at = new Date().toISOString()
    dispatch({ type, now: timestamp })
  }

  async function save() {
    if (timer.status !== 'finished' || saving.current || saveStatus === 'saved')
      return
    saving.current = true
    setSaveStatus('saving')
    setSaveError('')
    const session: LapSessionInput = {
      ...sessionMeta.current,
      elapsed_ms: timer.elapsedMs,
      laps_ms: [...timer.lapsMs],
    }
    try {
      const response = await fetch('/api/lap-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      })
      const result = await response.json()
      if (!response.ok)
        throw new Error(result.error || 'Unable to save session.')
      setSaveStatus('saved')
      void loadHistory()
    } catch (error) {
      setSaveStatus('unsaved')
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to save session. Please retry.',
      )
    } finally {
      saving.current = false
    }
  }

  const partial = currentLapTime(timer, now)
  const canRecord = partial > 0 && timer.lapsMs.length < MAX_LAPS
  const active = timer.status === 'running' || timer.status === 'paused'

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current session</CardTitle>
          <p role="status" className="text-sm capitalize text-slate-600">
            {timer.status}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-slate-600">
              {timer.status === 'finished'
                ? 'Active session time'
                : 'Current lap'}
            </p>
            <p
              className="mt-2 font-mono text-5xl font-semibold tabular-nums sm:text-6xl"
              data-testid="current-time"
            >
              {formatLapTime(
                timer.status === 'finished' ? timer.elapsedMs : partial,
              )}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 text-center">
            <div>
              <dt className="text-sm text-slate-600">Completed laps</dt>
              <dd className="text-2xl font-semibold" data-testid="lap-count">
                {timer.lapsMs.length}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Average lap</dt>
              <dd
                className="font-mono text-2xl font-semibold"
                data-testid="average-time"
              >
                {formatLapTime(averageLapTime(timer.lapsMs))}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap justify-center gap-3">
            {timer.status === 'idle' && (
              <Button size="lg" onClick={start}>
                Start
              </Button>
            )}
            {timer.status === 'running' && (
              <>
                <Button
                  size="lg"
                  onClick={() => act('lap')}
                  disabled={timer.lapsMs.length >= MAX_LAPS}
                >
                  Lap
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => act('pause')}
                >
                  Pause
                </Button>
              </>
            )}
            {timer.status === 'paused' && (
              <Button size="lg" onClick={() => act('resume')}>
                Resume
              </Button>
            )}
            {active && (
              <Button
                size="lg"
                variant="secondary"
                onClick={() => act('finish')}
              >
                Finish
              </Button>
            )}
          </div>
          {active && (
            <p className="text-center text-sm text-slate-600">
              Active time: {formatLapTime(elapsedTime(timer, now))}. Pauses are
              excluded.
            </p>
          )}
          {timer.lapsMs.length >= MAX_LAPS && (
            <p role="status">
              Lap limit reached. Finish this session to save it.
            </p>
          )}
          {timer.status === 'finishing' && (
            <section
              aria-labelledby="finish-heading"
              className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-4"
            >
              <h2 id="finish-heading" className="font-semibold">
                Record the partial final lap?
              </h2>
              <p>
                The timer is stopped. The final {formatLapTime(partial)} counts
                toward your average only if you record it.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={!canRecord}
                  onClick={() =>
                    dispatch({ type: 'complete', recordPartial: true })
                  }
                >
                  Record final lap
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    dispatch({ type: 'complete', recordPartial: false })
                  }
                >
                  Discard final lap
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => dispatch({ type: 'cancel-finish' })}
                >
                  Back to paused session
                </Button>
              </div>
            </section>
          )}
          {timer.status === 'finished' && (
            <div className="space-y-3 text-center">
              <p role="status">
                {saveStatus === 'saved'
                  ? 'Session saved.'
                  : 'Session finished. Save it to keep it in your history.'}
              </p>
              {partial > 0 && (
                <p className="text-sm text-slate-600">
                  Final {formatLapTime(partial)} discarded from lap history and
                  average.
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3">
                {saveStatus !== 'saved' && (
                  <Button onClick={save} disabled={saveStatus === 'saving'}>
                    {saveStatus === 'saving'
                      ? 'Saving…'
                      : saveError
                        ? 'Retry save'
                        : 'Save session'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  disabled={saveStatus === 'saving'}
                  onClick={() => {
                    if (
                      saveStatus !== 'saved' &&
                      !window.confirm('Discard this unsaved session?')
                    )
                      return
                    dispatch({ type: 'reset' })
                    setSaveError('')
                  }}
                >
                  {saveStatus === 'saved' ? 'New session' : 'Discard session'}
                </Button>
              </div>
              {saveError && (
                <p role="alert" className="text-red-700">
                  {saveError} Your session is still here.{' '}
                  <Link href="/login" target="_blank" className="underline">
                    Sign in in a new tab
                  </Link>{' '}
                  if needed, then retry.
                </p>
              )}
            </div>
          )}
          {unsaved && (
            <p className="text-sm text-slate-500">
              Keep this page open until you save. In-progress and unsaved
              sessions are held in this tab only.
            </p>
          )}
          <LapList laps={timer.lapsMs} />
        </CardContent>
      </Card>

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
            <details key={session.id} className="rounded-lg border p-4">
              <summary className="cursor-pointer space-y-1">
                <span className="font-medium">
                  {new Date(session.started_at).toLocaleString()}
                </span>
                <span className="block text-sm text-slate-600">
                  {session.laps_ms.length} laps · Average{' '}
                  {formatLapTime(averageLapTime(session.laps_ms))} · Active time{' '}
                  {formatLapTime(session.elapsed_ms)}
                </span>
              </summary>
              <div className="mt-4">
                <LapList laps={session.laps_ms} />
              </div>
            </details>
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
    </div>
  )
}

function LapList({ laps }: { laps: readonly number[] }) {
  return (
    <div className="max-h-72 overflow-y-auto">
      <table className="w-full text-sm">
        <caption className="mb-2 text-left font-medium">Lap history</caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2 text-left">
              Lap
            </th>
            <th scope="col" className="py-2 text-right">
              Time
            </th>
          </tr>
        </thead>
        <tbody>
          {laps.length === 0 ? (
            <tr>
              <td colSpan={2} className="py-3 text-slate-500">
                No completed laps.
              </td>
            </tr>
          ) : (
            laps.map((lap, i) => (
              <tr key={i} className="border-b last:border-0">
                <th scope="row" className="py-2 text-left font-normal">
                  {i + 1}
                </th>
                <td className="py-2 text-right font-mono tabular-nums">
                  {formatLapTime(lap)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
