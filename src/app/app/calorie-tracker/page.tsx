import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PhotoUpload } from '@/components/calorie-tracker/photo-upload'
import { MealLog } from '@/components/calorie-tracker/meal-log'
import { NutritionSummary } from '@/components/calorie-tracker/nutrition-summary'
import { Camera, Target, TrendingUp } from 'lucide-react'

export default async function CalorieTracker() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch recent nutrition logs
  const { data: nutritionLogs } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch today's nutrition summary
  const today = new Date().toISOString().split('T')[0]
  const { data: todayNutrition } = await supabase
    .from('nutrition_logs')
    .select('*')
    .eq('user_id', user!.id)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calorie Tracker</h1>
          <p className="text-gray-600 mt-2">
            Track your meals with AI-powered nutrition analysis
          </p>
        </div>
      </div>

      {/* Photo Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Log New Meal
          </CardTitle>
          <CardDescription>
            Take a photo of your meal for instant nutrition analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoUpload />
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Today&apos;s Nutrition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NutritionSummary data={todayNutrition || []} />
        </CardContent>
      </Card>

      {/* Recent Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Meals
          </CardTitle>
          <CardDescription>
            Your meal logging history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MealLog data={nutritionLogs || []} />
        </CardContent>
      </Card>
    </div>
  )
}