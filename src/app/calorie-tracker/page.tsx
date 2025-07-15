import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PhotoUpload from '@/components/calorie-tracker/PhotoUpload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle } from 'lucide-react'

interface CalorieTrackerPageProps {
  searchParams: { success?: string }
}

export default async function CalorieTrackerPage({ searchParams }: CalorieTrackerPageProps) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  const showSuccessMessage = searchParams.success === 'true'

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