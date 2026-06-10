import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Droplets } from "lucide-react"
import BodyFatTracker from "@/components/body-fat-tracker/BodyFatTracker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/server"

/**
 * Renders the authenticated body fat tracking module.
 *
 * Redirects unauthenticated users to the login page and presents a focused
 * tracking workflow for saving body fat readings and reviewing recent history.
 */
export default async function BodyFatPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Body Fat Tracker</h1>
              <p className="text-sm text-slate-600">
                Save body composition readings alongside the weight entries already stored in your account.
              </p>
            </div>
          </div>
        </div>

        <Card className="border-blue-100 bg-blue-50/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-950">
              <Droplets className="h-5 w-5" />
              Track body composition with weight-aware entries
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900">
            Each saved reading stores both body fat percentage and your weight at that moment, which keeps the
            tracker consistent with the app&apos;s existing `weight_logs` history.
          </CardContent>
        </Card>

        <BodyFatTracker />
      </div>
    </div>
  )
}
