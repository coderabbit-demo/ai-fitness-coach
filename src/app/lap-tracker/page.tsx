import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import LapTracker from '@/components/lap-tracker/LapTracker'

export default async function LapTrackerPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect('/login')

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap gap-5 text-sm text-blue-700"
        >
          <Link href="/">Home</Link>
          <Link href="/calorie-tracker">Calorie tracker</Link>
          <Link href="/profile">Profile</Link>
        </nav>
        <header>
          <h1 className="text-3xl font-bold">Lap tracker</h1>
          <p className="mt-2 text-slate-600">
            Time each lap, find your average, and save your session.
          </p>
        </header>
        <LapTracker />
      </div>
    </main>
  )
}
