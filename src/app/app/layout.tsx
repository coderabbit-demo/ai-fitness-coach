import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AppNavigation } from '@/components/app/navigation'
import { Toaster } from '@/components/ui/toaster'

/**
 * Provides the authenticated application layout and enforces server-side authentication.
 *
 * Redirects the request to `/login` when no authenticated user is found. When a user
 * is present, renders the app navigation (passed the authenticated user), a main
 * content area containing `children`, and a Toaster for notifications.
 *
 * @param children - React nodes to render inside the layout's main content area
 * @returns A React element containing the authenticated app layout
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <AppNavigation user={user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Toaster />
    </div>
  )
}