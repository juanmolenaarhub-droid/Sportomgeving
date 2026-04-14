import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import ProfileLoader from '../[id]/_components/ProfileLoader'

export default async function MyProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <ProfileLoader
      profileId={user.id}
      currentUserId={user.id}
      isOwnProfile={true}
    />
  )
}
