import { createClient } from '@/utils/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  WeightProgressChart, 
  CalorieIntakeChart, 
  MoodSleepChart 
} from '@/components/dashboard-preview'
import { Camera, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default async function AppDashboard() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch user profile and recent data
  const [profileResult, recentNutritionResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('nutrition_logs')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  const profile = profileResult.data
  const recentNutrition = recentNutritionResult.data || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name || user?.email}!
          </h1>
          <p className="text-gray-600 mt-2">
            Track your health journey with AI-powered insights
          </p>
        </div>
        <Button asChild>
          <Link href="/app/calorie-tracker">
            <Camera className="w-4 h-4 mr-2" />
            Log Meal
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Today&apos;s Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {recentNutrition.length > 0 ? 
                recentNutrition
                  .filter(log => {
                    const today = new Date().toDateString()
                    const logDate = new Date(log.created_at).toDateString()
                    return today === logDate
                  })
                  .reduce((sum, log) => sum + (log.total_calories || 0), 0)
                : 0
              }
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {recentNutrition.length} meals logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile?.weight_kg ? `${profile.weight_kg} kg` : 'Not set'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Target: {profile?.weight_kg ? `${profile.weight_kg - 5} kg` : 'Set target'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fitness Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {profile?.fitness_goals && profile.fitness_goals.length > 0 ? (
                profile.fitness_goals.slice(0, 2).map((goal: string) => (
                  <Badge key={goal} variant="outline" className="text-xs">
                    {goal}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">None set</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WeightProgressChart />
        </div>
        <div className="space-y-6">
          <CalorieIntakeChart />
          <MoodSleepChart />
        </div>
      </div>

      {/* Recent Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Meals
          </CardTitle>
          <CardDescription>
            Your latest food logging activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentNutrition.length > 0 ? (
            <div className="space-y-4">
              {recentNutrition.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {log.image_url && (
                      <Image 
                        src={log.image_url} 
                        alt="Meal" 
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">
                        {log.food_items ? 
                          typeof log.food_items === 'string' ? 
                            log.food_items : 
                            JSON.stringify(log.food_items)
                          : 'Meal'
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{log.total_calories || 0} cal</p>
                    {log.confidence_score && (
                      <p className="text-xs text-gray-500">
                        {Math.round(log.confidence_score * 100)}% confident
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No meals logged yet</p>
              <Button asChild>
                <Link href="/app/calorie-tracker">
                  Log Your First Meal
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}