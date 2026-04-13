import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileContent, { type ProfileData } from '../[id]/_components/ProfileContent'

export default async function MyProfilePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const userId = user.id

  const [
    { data: dbProfile },
    { data: userSports },
    { count: followersCount },
    { count: followingCount },
    { count: postsCount },
    { count: groupsCount },
  ] = await Promise.all([
    supabase.from('profiles')
      .select('*')
      .eq('id', userId)
      .single(),
    supabase.from('user_sports')
      .select('sport_id, level, sports(name)')
      .eq('user_id', userId),
    supabase.from('follow_requests')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', userId)
      .eq('status', 'accepted'),
    supabase.from('follow_requests')
      .select('*', { count: 'exact', head: true })
      .eq('from_user_id', userId)
      .eq('status', 'accepted'),
    supabase.from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase.from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  if (!dbProfile) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-gray-400 font-semibold">Profiel niet gevonden.</p>
        <Link href="/dashboard" className="mt-4 inline-block text-[#E87722] font-bold hover:underline">
          Terug naar dashboard
        </Link>
      </div>
    )
  }

  const db = dbProfile as any
  const levelLabel: Record<string, string> = {
    beginner: 'Beginner', intermediate: 'Gemiddeld', advanced: 'Gevorderd',
  }
  const mappedSports = (userSports ?? []).map((s: any) => ({
    label: (Array.isArray(s.sports) ? s.sports[0]?.name : s.sports?.name) ?? 'Sport',
    level: levelLabel[s.level] ?? s.level,
  }))

  const profile: ProfileData = {
    id:              db.id,
    name:            db.full_name ?? db.username ?? 'Jouw naam',
    username:        db.username ?? undefined,
    region:          db.region ?? '',
    bio:             db.bio ?? '',
    sports:          mappedSports,
    avatarUrl:       db.avatar_url ?? undefined,
    bannerUrl:       db.banner_url ?? undefined,
    beschikbaarheid: db.beschikbaarheid ?? [],
    createdAt:       db.created_at ?? undefined,
    stats: {
      volgers:  followersCount ?? 0,
      volgend:  followingCount ?? 0,
      posts:    postsCount ?? 0,
      groepen:  groupsCount ?? 0,
    },
  }

  return (
    <ProfileContent
      profile={profile}
      followStatus="accepted"
      currentUserId={userId}
      isOwnProfile={true}
    />
  )
}
