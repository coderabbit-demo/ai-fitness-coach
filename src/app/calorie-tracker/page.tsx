import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CalorieTrackerDashboard } from '@/components/calorie-tracker/CalorieTrackerDashboard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'

interface CalorieTrackerPageProps {
  searchParams: Promise<{ success?: string }>
}

/**
 * Renders the comprehensive calorie tracker dashboard for authenticated users.
 *
 * Displays daily nutrition summary, weekly trends, recent meals, and meal logging interface.
 * Redirects unauthenticated users to the login page. Shows success messages for completed actions.
 *
 * @param searchParams - Optional search parameters for success messages and navigation state
 */
export default async function CalorieTrackerPage({ searchParams }: CalorieTrackerPageProps) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  const resolvedSearchParams = await searchParams
  const showSuccessMessage = resolvedSearchParams.success === 'true'

  return (
    <div className="container mx-auto px-4 py-6">
      {showSuccessMessage && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your meal has been successfully logged!
          </AlertDescription>
        </Alert>
      )}

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading your nutrition dashboard...</span>
        </div>
      }>
        <CalorieTrackerDashboard userId={user.id} />
      </Suspense>
    </div>
  )
}