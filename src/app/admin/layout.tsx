import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { AdminSidebar } from './_components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.id !== process.env.ADMIN_USER_ID) {
    redirect(user ? '/dashboard' : '/login')
  }

  return (
    <div className="min-h-screen bg-[#F4F1E8] flex" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <AdminSidebar />
      <main className="flex-1 min-w-0 pt-14 md:pt-0">
        {children}
      </main>
    </div>
  )
}
