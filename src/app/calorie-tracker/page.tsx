import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PhotoUpload from '@/components/calorie-tracker/PhotoUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'

interface CalorieTrackerPageProps {
  searchParams: Promise<{ success?: string }>
}

/**
 * Renders the calorie tracker page, displaying a meal logging interface for authenticated users.
 *
 * Redirects unauthenticated users to the login page. Conditionally shows a success alert if a meal has been logged, and provides a photo upload component for meal analysis.
 *
 * @param searchParams - Optional search parameters, including a `success` flag to indicate if a meal was logged successfully
 */
export default async function CalorieTrackerPage({ searchParams }: CalorieTrackerPageProps) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todayLogs } = await supabase
    .from('nutrition_logs')
    .select('calories, protein_g, carbs_g, fat_g')
    .eq('user_id', user.id)
    .gte('logged_at', today.toISOString())

  const totals = (todayLogs ?? []).reduce(
    (acc, log) => ({
      calories: acc.calories + (log.calories ?? 0),
      protein: acc.protein + (log.protein_g ?? 0),
      carbs: acc.carbs + (log.carbs_g ?? 0),
      fat: acc.fat + (log.fat_g ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const resolvedSearchParams = await searchParams
  const showSuccessMessage = resolvedSearchParams.success === 'true'

  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {showSuccessMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your meal has been successfully logged!
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Today&apos;s Summary</CardTitle>
            <p className="text-sm text-gray-500">{todayLabel}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{Math.round(totals.calories)}</p>
                <p className="text-xs text-gray-500 mt-1">Calories (kcal)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{Math.round(totals.protein)}</p>
                <p className="text-xs text-gray-500 mt-1">Protein (g)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">{Math.round(totals.carbs)}</p>
                <p className="text-xs text-gray-500 mt-1">Carbs (g)</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{Math.round(totals.fat)}</p>
                <p className="text-xs text-gray-500 mt-1">Fat (g)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Calorie Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Take a photo of your meal and let AI analyze the nutritional content,
              or enter the information manually.
            </p>
          </CardContent>
        </Card>

        <Suspense fallback={<div>Loading...</div>}>
          <PhotoUpload />
        </Suspense>
      </div>
    </div>
  )
}