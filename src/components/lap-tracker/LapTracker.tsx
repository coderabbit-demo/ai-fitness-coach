'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import ActiveSession from './ActiveSession'
import SessionHistory from './SessionHistory'

export default function LapTracker({ userId }: { userId: string }) {
  const [accountChanged, setAccountChanged] = useState(false)
  const [refresh, setRefresh] = useState(0)
  const validAccount = useRef(true)
  const invalidateAccount = useCallback(() => {
    validAccount.current = false
    setAccountChanged(true)
  }, [])
  const saved = useCallback(() => {
    if (validAccount.current) setRefresh((value) => value + 1)
  }, [])

  useEffect(() => {
    const client = createClient()
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id !== userId) invalidateAccount()
    })
    return () => subscription.unsubscribe()
  }, [userId, invalidateAccount])

  if (accountChanged)
    return (
      <div role="alert" className="space-y-4 rounded-lg border bg-white p-6">
        <p>
          This tracker was cleared because your signed-in account changed.
          Reload to start a fresh tracker for your current account.
        </p>
        <Button onClick={() => window.location.reload()}>Reload tracker</Button>
      </div>
    )

  return (
    <div className="space-y-6">
      <ActiveSession
        key={`active:${userId}`}
        userId={userId}
        onAccountChanged={invalidateAccount}
        onSaved={saved}
      />
      <SessionHistory
        key={`history:${userId}`}
        userId={userId}
        refresh={refresh}
        onAccountChanged={invalidateAccount}
      />
    </div>
  )
}
