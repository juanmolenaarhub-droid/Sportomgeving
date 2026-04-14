'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import ProfileContent, { type ProfileData, type FollowStatus } from './ProfileContent'

type Props = {
  profileId: string
  currentUserId: string
  isOwnProfile: boolean
}

export default function ProfileLoader({ profileId, currentUserId, isOwnProfile }: Props) {
  const [profile, setProfile]           = useState<ProfileData | null>(null)
  const [followStatus, setFollowStatus] = useState<FollowStatus>('none')
  const [loading, setLoading]           = useState(true)
  const [debugInfo, setDebugInfo]       = useState<string>('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      // Eerst alleen het profiel ophalen om te zien of dat lukt
      const { data: dbProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle()

      if (profileError || !dbProfile) {
        setDebugInfo(`profileId=${profileId} | error=${profileError?.message ?? 'none'} | data=${dbProfile === null ? 'null' : 'present'}`)
        setLoading(false)
        return
      }

      // Rest van de data ophalen
      const levelLabel: Record<string, string> = {
        beginner: 'Beginner', intermediate: 'Gemiddeld', advanced: 'Gevorderd',
      }

      const [
        { data: userSports },
        { data: myRequest },
        { data: theirRequest },
        { count: followersCount },
        { count: followingCount },
        { count: postsCount },
        { count: groupsCount },
      ] = await Promise.all([
        supabase.from('user_sports').select('sport_id, level, sports(name)').eq('user_id', profileId),
        supabase.from('follow_requests').select('status')
          .eq('from_user_id', currentUserId).eq('to_user_id', profileId)
          .neq('status', 'declined').maybeSingle(),
        supabase.from('follow_requests').select('status')
          .eq('from_user_id', profileId).eq('to_user_id', currentUserId)
          .neq('status', 'declined').maybeSingle(),
        supabase.from('follow_requests').select('*', { count: 'exact', head: true })
          .eq('to_user_id', profileId).eq('status', 'accepted'),
        supabase.from('follow_requests').select('*', { count: 'exact', head: true })
          .eq('from_user_id', profileId).eq('status', 'accepted'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profileId),
        supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', profileId),
      ])

      // Follow status
      let status: FollowStatus = 'none'
      if (myRequest?.status === 'accepted' || theirRequest?.status === 'accepted') status = 'accepted'
      else if (myRequest?.status === 'pending') status = 'pending'
      else if (theirRequest?.status === 'pending') status = 'pending_received'
      setFollowStatus(status)

      const db = dbProfile as any
      const mappedSports = (userSports ?? []).map((s: any) => ({
        label: (Array.isArray(s.sports) ? s.sports[0]?.name : s.sports?.name) ?? 'Sport',
        level: levelLabel[s.level] ?? s.level,
      }))

      setProfile({
        id:              db.id,
        name:            db.full_name ?? db.username ?? 'Onbekend',
        username:        db.username ?? undefined,
        region:          db.region ?? '',
        bio:             db.bio ?? '',
        sports:          mappedSports,
        avatarUrl:       db.avatar_url ?? undefined,
        bannerUrl:       db.banner_url ?? undefined,
        beschikbaarheid: db.beschikbaarheid ?? [],
        createdAt:       db.created_at ?? undefined,
        stats: {
          volgers: followersCount ?? 0,
          volgend: followingCount ?? 0,
          posts:   postsCount    ?? 0,
          groepen: groupsCount   ?? 0,
        },
      })

      setLoading(false)
    }

    load()
  }, [profileId, currentUserId])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pb-20 space-y-4 animate-pulse">
        <div className="bg-white rounded-2xl overflow-hidden border border-black/8">
          <div className="h-[140px] sm:h-[200px] bg-gray-100" />
          <div className="px-5 pb-5 pt-2 space-y-3">
            <div className="w-24 h-24 rounded-full bg-gray-200 -mt-12" />
            <div className="h-6 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-100 rounded w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-3">
        <p className="text-gray-400 font-semibold">Profiel niet gevonden.</p>
        {debugInfo && (
          <p className="text-xs text-red-400 font-mono bg-red-50 rounded-xl px-4 py-2 max-w-md mx-auto break-all">{debugInfo}</p>
        )}
        <Link href="/dashboard/find" className="inline-block text-[#E87722] font-bold hover:underline">
          Terug naar zoeken
        </Link>
      </div>
    )
  }

  return (
    <ProfileContent
      profile={profile}
      followStatus={followStatus}
      currentUserId={currentUserId}
      isOwnProfile={isOwnProfile}
    />
  )
}
