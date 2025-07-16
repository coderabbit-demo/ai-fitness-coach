import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PhotoUpload from '@/components/calorie-tracker/PhotoUpload'
import { DailyCalorieSummary } from '@/components/calorie-tracker/DailyCalorieSummary'
import { WeeklyTrendsChart } from '@/components/calorie-tracker/WeeklyTrendsChart'
import { QuickActions } from '@/components/calorie-tracker/QuickActions'
import { RecentMeals } from '@/components/calorie-tracker/RecentMeals'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'

interface CalorieTrackerPageProps {
  searchParams: Promise<{ success?: string; view?: string }>
}

/**
 * Renders the calorie tracker page, displaying a comprehensive nutrition dashboard for authenticated users.
 *
 * Shows daily nutrition summary, weekly trends, recent meals, and quick actions. Conditionally displays 
 * a meal logging interface or the main dashboard based on search parameters.
 *
 * @param searchParams - Optional search parameters, including `success` flag and `view` parameter
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
  const view = resolvedSearchParams.view || 'dashboard'

  // If user wants to add a meal, show the PhotoUpload component
  if (view === 'add') {
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

          <Suspense fallback={<div>Loading...</div>}>
            <PhotoUpload />
          </Suspense>
        </div>
      </div>
    )
  }

  // Fetch dashboard data with error handling
  const today = new Date().toISOString().split('T')[0];
  const { data: dailySummary, error: dailySummaryError } = await supabase
    .from('daily_nutrition_summaries')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle();

  if (dailySummaryError) {
    console.error('Error fetching daily summary:', dailySummaryError);
  }

  // Fetch user goals with error handling
  const { data: userGoals, error: userGoalsError } = await supabase
    .from('user_nutrition_goals')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (userGoalsError) {
    console.error('Error fetching user goals:', userGoalsError);
  }

  // Fetch recent meals with error handling
  const { data: recentMeals, error: recentMealsError } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('processing_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentMealsError) {
    console.error('Error fetching recent meals:', recentMealsError);
  }

  // Main dashboard view
  return (
    <div className="space-y-6">
      {showSuccessMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Your meal has been successfully logged!
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Calorie Tracker</h1>
        <QuickActions />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Summary */}
        <div className="lg:col-span-2">
          <DailyCalorieSummary 
            summary={dailySummary} 
            goals={userGoals}
          />
        </div>
        
        {/* Weekly Trends */}
        <div>
          <WeeklyTrendsChart userId={user.id} />
        </div>
      </div>

      {/* Recent Meals */}
      <RecentMeals meals={recentMeals || []} />
    </div>
  )
}