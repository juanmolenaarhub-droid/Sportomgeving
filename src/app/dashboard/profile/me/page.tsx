'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Award, Settings, UserPlus, Users, MessageCircle, Heart, Bell, Lightbulb, ThumbsUp, Bug } from 'lucide-react'
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

function ProfileFeedbackWidget() {
  const [selected, setSelected] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className="flex flex-col items-center py-4 gap-2 text-center">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <ThumbsUp className="w-5 h-5 text-green-600" />
        </div>
        <p className="text-sm font-bold text-black">Bedankt!</p>
        <p className="text-xs text-gray-400">We nemen je feedback mee.</p>
      </div>
    )
  }

  const options = [
    { key: 'idea', label: 'Idee delen', icon: Lightbulb, color: 'text-yellow-500 bg-yellow-50' },
    { key: 'good', label: 'Werkt goed', icon: ThumbsUp, color: 'text-green-600 bg-green-50' },
    { key: 'bug', label: 'Bug melden', icon: Bug, color: 'text-red-500 bg-red-50' },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setSelected(selected === key ? null : key)}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all text-center ${
              selected === key ? 'border-[#111] bg-black/5' : 'border-gray-100 hover:border-gray-200'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-bold text-gray-600 leading-tight">{label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="space-y-2">
          <textarea
            rows={3}
            placeholder="Schrijf hier je feedback..."
            className="w-full text-xs text-gray-700 placeholder-gray-300 border border-gray-100 rounded-xl p-3 resize-none focus:outline-none focus:border-[#111] transition-colors"
          />
          <button
            onClick={() => setSent(true)}
            className="w-full py-2 bg-[#111111] text-white text-xs font-bold rounded-xl hover:bg-[#333] transition-colors"
          >
            Versturen
          </button>
        </div>
      )}
    </div>
  )
}

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

        {/* Rechter kolom: acties + activiteit + groepen + feedback */}
        <div className="md:col-span-2 space-y-4">

          {/* Zoek een buddy */}
          <Link href="/dashboard/find" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#E87722] hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#E87722]" />
            </div>
            <div>
              <p className="font-black text-black group-hover:text-[#E87722] transition-colors">Zoek een buddy</p>
              <p className="text-xs text-gray-400 mt-0.5">Vind sporters op jouw niveau in jouw buurt</p>
            </div>
          </Link>

          {/* Activiteit */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-black mb-4">Activiteit</h3>
            <div className="space-y-1.5">
              <Link href="/dashboard/messages" className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-2.5 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Berichten</span>
                </div>
                <span className="text-xs font-black text-white bg-blue-500 px-2 py-0.5 rounded-full">2</span>
              </Link>
              <div className="flex items-center justify-between -mx-2 px-2 py-2.5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-pink-50 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-pink-500" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Likes</span>
                </div>
                <span className="text-sm font-black text-gray-400">12</span>
              </div>
              <div className="flex items-center justify-between -mx-2 px-2 py-2.5 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Notificaties</span>
                </div>
                <span className="text-xs font-black text-white bg-gray-800 px-2 py-0.5 rounded-full">5</span>
              </div>
            </div>
          </div>

          {/* Mijn groepen */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-black">Mijn groepen</h3>
              <Link href="/dashboard/groups" className="text-xs text-[#E87722] font-semibold hover:underline">Alle groepen</Link>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Cycling Amsterdam', members: 24, sport: 'Fietsen' },
                { name: 'Vondelpark Runners', members: 41, sport: 'Hardlopen' },
              ].map(group => (
                <div key={group.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#E87722]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-[#E87722]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black truncate">{group.name}</p>
                    <p className="text-xs text-gray-400">{group.members} leden · {group.sport}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback & ideeën */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-black">Feedback & ideeën</h3>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Nieuw</span>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">Help ons Buddys beter te maken. Wat mist er? Wat kan beter?</p>
            <ProfileFeedbackWidget />
          </div>

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
