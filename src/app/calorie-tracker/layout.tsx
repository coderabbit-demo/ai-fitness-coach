import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Server component layout for the calorie tracker feature that enforces user authentication.
 *
 * Redirects unauthenticated users to the login page. Authenticated users see a layout with a navigation bar displaying the app title and their email, and the provided child components rendered below.
 *
 * @param children - The content to display within the main area of the layout
 */
export default async function CalorieTrackerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Calorie Tracker</h1>
            <div className="text-sm text-gray-600">
              Welcome, {user.email}
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}