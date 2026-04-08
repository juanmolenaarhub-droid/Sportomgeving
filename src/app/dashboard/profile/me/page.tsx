'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Award, Settings, UserPlus, Users } from 'lucide-react'
import { ProfileHeader } from '@/components/ProfileHeader'
import { createClient } from '@/lib/supabase'

type Profile = {
  id: string
  full_name: string | null
  region: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  age: number | null
}

type UserSport = {
  sport_id: number
  level: string
  sports: { name: string } | { name: string }[] | null
}

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Gemiddeld',
  advanced: 'Gevorderd',
}

const recentPosts = [
  { id: 1, content: 'Geweldige ochtendrun door het park. 10km in 52 minuten!', sport: 'Hardlopen', time: '2 dagen geleden', likes: 14 },
  { id: 2, content: 'Eindelijk die 100km op de fiets gehaald. Uitgeput maar blij!', sport: 'Fietsen', time: '1 week geleden', likes: 28 },
]

export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sports, setSports] = useState<UserSport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: sp }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, region, bio, avatar_url, banner_url, age').eq('id', user.id).single(),
        supabase.from('user_sports').select('sport_id, level, sports(name)').eq('user_id', user.id),
      ])

      if (prof) setProfile(prof)
      if (sp) setSports(sp as UserSport[])
      setLoading(false)
    }
    load()
  }, [])

  const displayName = profile?.full_name || 'Jouw Naam'
  const displayRegion = profile?.region || 'Nederland'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profiel header kaart */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <ProfileHeader
          name={displayName}
          avatarUrl={profile?.avatar_url}
          bannerUrl={profile?.banner_url}
          editable={false}
          size="md"
        />
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between">
            <div>
              {loading ? (
                <div className="space-y-2 mt-1">
                  <div className="h-6 bg-gray-100 rounded w-40 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-28 animate-pulse" />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-black text-black">{displayName}</h1>
                  <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {displayRegion}
                    {profile?.age && <span className="ml-2">{profile.age} jaar</span>}
                  </div>
                </>
              )}
              {profile?.bio && (
                <p className="text-sm text-gray-600 mt-3 max-w-lg leading-relaxed">{profile.bio}</p>
              )}
            </div>
            <Link
              href="/dashboard/profile/me/edit"
              className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" /> Profiel bewerken
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-6 pt-6 border-t border-gray-50">
            <div className="text-center">
              <p className="text-2xl font-black text-black">0</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Volgers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-black">0</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Volgend</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-black">0</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-black">0</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Groepen</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sporten */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-black">Sporten</h3>
            <Link href="/dashboard/profile/me/edit" className="text-xs text-[#E87722] font-semibold hover:underline">Bewerken</Link>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : sports.length > 0 ? (
            <div className="space-y-2.5">
              {sports.map(s => {
                const name = (Array.isArray(s.sports) ? s.sports[0]?.name : s.sports?.name) ?? 'Sport'
                const lbl = levelLabel[s.level] ?? s.level
                return (
                  <div key={s.sport_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-[#E87722]" />
                      <span className="text-sm font-semibold text-gray-700">{name}</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${lbl === 'Gevorderd' ? 'bg-black text-white' : lbl === 'Gemiddeld' ? 'bg-[#E87722] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {lbl}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nog geen sporten. <Link href="/onboarding" className="text-[#E87722] font-semibold">Voeg toe</Link></p>
          )}
        </div>

        {/* Snelle acties */}
        <div className="md:col-span-2 space-y-3">
          <Link href="/dashboard/find" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#E87722] hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#E87722]" />
            </div>
            <div>
              <p className="font-black text-black group-hover:text-[#E87722] transition-colors">Zoek een buddy</p>
              <p className="text-xs text-gray-400 mt-0.5">Vind sporters op jouw niveau in jouw buurt</p>
            </div>
          </Link>
          <Link href="/dashboard/groups" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#E87722] hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-[#E87722]" />
            </div>
            <div>
              <p className="font-black text-black group-hover:text-[#E87722] transition-colors">Mijn groepen</p>
              <p className="text-xs text-gray-400 mt-0.5">Bekijk de groepen waar je lid van bent</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recente posts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-black">Recente activiteit</h3>
          <Link href="/dashboard/feed" className="text-sm text-[#E87722] font-semibold hover:underline">Naar tijdlijn</Link>
        </div>
        <div className="space-y-4">
          {recentPosts.map(post => (
            <div key={post.id} className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-700">{post.content}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-xs font-semibold text-[#E87722]">{post.sport}</span>
                <span className="text-xs text-gray-400">{post.time}</span>
                <span className="text-xs text-gray-400">{post.likes} likes</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
