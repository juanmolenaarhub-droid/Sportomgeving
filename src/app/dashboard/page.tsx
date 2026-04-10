'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserPlus, MapPin, Award, ArrowRight, MessageCircle, Heart, Bell, Users, Lightbulb, ThumbsUp, Bug } from 'lucide-react'

function FeedbackWidget() {
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
import { StoryAvatar, type StoryPost } from '@/components/StoryAvatar'
import { ProfileHeader } from '@/components/ProfileHeader'
import { createClient } from '@/lib/supabase'

const following = [
  { id: '1', name: 'Tim van Berg', sport: 'Hardlopen', region: 'Amsterdam', level: 'Gevorderd',
    post: { id: 'p1', user: { name: 'Tim van Berg', region: 'Amsterdam' }, content: 'Geweldige ochtendrun door het Vondelpark.', activity_type: 'run', activity_label: 'Hardlopen', distance_km: 10.4, duration_minutes: 52, image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80', likes_count: 24, comments_count: 5, created_at: '2 min geleden' } as StoryPost },
  { id: '2', name: 'Sarah Jansen', sport: 'Fietsen', region: 'Utrecht', level: 'Gemiddeld',
    post: { id: 'p2', user: { name: 'Sarah Jansen', region: 'Utrecht' }, content: '45km gefietst langs de Vecht.', activity_type: 'cycle', activity_label: 'Fietsen', distance_km: 45, duration_minutes: 105, image_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80', likes_count: 41, comments_count: 8, created_at: '1 uur geleden' } as StoryPost },
  { id: '3', name: 'Marco de Wit', sport: 'Gym', region: 'Rotterdam', level: 'Gevorderd',
    post: { id: 'p3', user: { name: 'Marco de Wit', region: 'Rotterdam' }, content: 'PR vandaag op deadlift: 160kg.', activity_type: 'gym', activity_label: 'Gym', likes_count: 67, comments_count: 12, created_at: '3 uur geleden' } as StoryPost },
  { id: '4', name: 'Lisa Hoek', sport: 'Yoga', region: 'Amsterdam', level: 'Gevorderd',
    post: { id: 'p4', user: { name: 'Lisa Hoek', region: 'Amsterdam' }, content: 'Yoga in het park. Wie wil volgende week ook komen?', activity_type: 'yoga', activity_label: 'Yoga', image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', likes_count: 89, comments_count: 21, created_at: 'Gisteren' } as StoryPost },
  { id: '5', name: 'Kevin Smit', sport: 'Voetbal', region: 'Den Haag', level: 'Gemiddeld', post: null },
  { id: '6', name: 'Anna de Boer', sport: 'Zwemmen', region: 'Amsterdam', level: 'Gevorderd', post: null },
]

type Profile = {
  id: string
  full_name: string | null
  region: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
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

export default function DashboardHomePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sports, setSports] = useState<UserSport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: sp }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, region, bio, avatar_url, banner_url').eq('id', user.id).single(),
        supabase.from('user_sports').select('sport_id, level, sports(name)').eq('user_id', user.id),
      ])

      if (prof) setProfile(prof)
      if (sp) setSports(sp as UserSport[])
      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarChange(file: File) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : prev)
    }
  }

  async function handleBannerChange(file: File) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const ext = file.name.split('.').pop()
    const path = `banners/${user.id}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ banner_url: data.publicUrl }).eq('id', user.id)
      setProfile(prev => prev ? { ...prev, banner_url: data.publicUrl } : prev)
    }
  }

  const displayName = profile?.full_name || 'Jouw Naam'
  const displayRegion = profile?.region || 'Nederland'
  const displayBio = profile?.bio || 'Stel je profiel in via onboarding om je bio te zien.'

  return (
    <div className="grid lg:grid-cols-3 gap-8">

      {/* Linker kolom: eigen profiel */}
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <ProfileHeader
            name={displayName}
            avatarUrl={profile?.avatar_url}
            bannerUrl={profile?.banner_url}
            editable={true}
            size="sm"
            onBannerChange={handleBannerChange}
            onAvatarChange={handleAvatarChange}
          />
          <div className="px-5 pb-5 -mt-2">
            {loading ? (
              <div className="space-y-2">
                <div className="h-5 bg-gray-100 rounded w-32 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-black text-black">{displayName}</h2>
                <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1">
                  <MapPin className="w-3.5 h-3.5" /> {displayRegion}
                </div>
                <p className="text-sm text-gray-500 mt-3 leading-relaxed">{displayBio}</p>
              </>
            )}
            <div className="flex gap-4 mt-5 pt-5 border-t border-gray-50">
              {[{ label: 'Volgers', value: '0' }, { label: 'Volgend', value: '0' }, { label: 'Groepen', value: '0' }].map(stat => (
                <div key={stat.label} className="text-center flex-1">
                  <p className="text-xl font-black text-black">{stat.value}</p>
                  <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-black">Mijn sporten</h3>
            <Link href="/dashboard/profile/me/edit" className="text-xs text-[#E87722] font-semibold hover:underline">Bewerken</Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : sports.length > 0 ? (
            <div className="space-y-2.5">
              {sports.map(s => {
                const name = (Array.isArray(s.sports) ? s.sports[0]?.name : s.sports?.name) ?? 'Sport'
                const lbl = levelLabel[s.level] ?? s.level
                return (
                  <div key={s.sport_id} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-700">{name}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${lbl === 'Gevorderd' ? 'bg-black text-white' : lbl === 'Gemiddeld' ? 'bg-[#E87722] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {lbl}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nog geen sporten toegevoegd. <Link href="/onboarding" className="text-[#E87722] font-semibold hover:underline">Voeg ze toe</Link></p>
          )}
        </div>

        {/* Activiteit tellers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 order-first lg:order-none">
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

        {/* Inkomende volgverzoeken */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-black">Volgverzoeken</h3>
            <span className="text-xs font-black text-white bg-[#E87722] px-2 py-0.5 rounded-full">3</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Kevin Smit', region: 'Den Haag', sport: 'Voetbal', msg: 'Hey! Ik zoek iemand voor weekendmatches.' },
              { name: 'Anna de Boer', region: 'Amsterdam', sport: 'Zwemmen', msg: 'Zin om samen te trainen?' },
              { name: 'Daan Bakker', region: 'Haarlem', sport: 'Tennis', msg: '' },
            ].map((req) => (
              <div key={req.name} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <StoryAvatar name={req.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black leading-none">{req.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{req.region} · {req.sport}</p>
                  </div>
                </div>
                {req.msg && (
                  <p className="text-xs text-gray-500 italic mb-2.5 leading-relaxed px-1">&ldquo;{req.msg}&rdquo;</p>
                )}
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 bg-[#111111] text-white text-xs font-bold rounded-lg hover:bg-[#333] transition-colors">
                    Accepteren
                  </button>
                  <button className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                    Weigeren
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link href="/dashboard/find" className="flex items-center justify-between bg-[#111111] text-white rounded-2xl p-5 hover:bg-[#333] transition-colors group">
          <div>
            <p className="font-black">Zoek een buddy</p>
            <p className="text-sm text-white/70 mt-0.5">Vind sporters in jouw buurt</p>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

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
            <Link href="/dashboard/groups" className="flex items-center justify-center gap-2 w-full py-2 mt-1 border border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-[#E87722] hover:text-[#E87722] transition-colors">
              <Users className="w-3.5 h-3.5" /> Groep zoeken
            </Link>
          </div>
        </div>

        {/* Feedback & ideeën */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-black text-black">Feedback & ideeën</h3>
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Nieuw</span>
          </div>
          <p className="text-xs text-gray-400 mb-4 leading-relaxed">Help ons Buddys beter te maken. Wat mist er? Wat kan beter?</p>
          <FeedbackWidget />
        </div>

      </div>

      {/* Rechter kolom */}
      <div className="lg:col-span-2 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-black">Mensen die ik volg</h2>
          <Link href="/dashboard/find" className="flex items-center gap-1.5 text-sm font-semibold text-[#E87722] hover:underline">
            <UserPlus className="w-4 h-4" /> Meer vinden
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {following.map(person => (
            <Link key={person.name} href={`/dashboard/profile/${person.id}`} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#E87722] hover:shadow-sm transition-all group block">
              <div className="flex items-start justify-between mb-4">
                <StoryAvatar name={person.name} size="lg" posts={person.post ? [person.post] : []} />
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${person.level === 'Gevorderd' ? 'bg-black text-white' : person.level === 'Gemiddeld' ? 'bg-[#E87722] text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {person.level}
                </span>
              </div>
              <h3 className="font-black text-black text-sm group-hover:text-[#E87722] transition-colors">{person.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{person.region}</p>
              <p className="text-xs font-semibold text-gray-500 mt-3 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#E87722]" />{person.sport}
              </p>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-black">Recente activiteit</h3>
            <Link href="/dashboard/feed" className="text-sm text-[#E87722] font-semibold hover:underline">Naar tijdlijn</Link>
          </div>
          <div className="space-y-4">
            {[
              { id: '1', name: 'Tim van Berg', action: 'heeft een 10km run gedeeld', sport: 'Hardlopen', time: '2 min geleden' },
              { id: '2', name: 'Sarah Jansen', action: 'heeft zich aangesloten bij Cycling Amsterdam', sport: 'Fietsen', time: '1 uur geleden' },
              { id: '3', name: 'Marco de Wit', action: 'heeft een nieuwe training gepost', sport: 'Gym', time: '3 uur geleden' },
            ].map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                <Link href={`/dashboard/profile/${item.id}`}>
                  <StoryAvatar name={item.name} size="sm" />
                </Link>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <Link href={`/dashboard/profile/${item.id}`} className="font-bold text-black hover:text-[#E87722] transition-colors">{item.name}</Link>
                    {' '}{item.action}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
                <span className="text-xs font-semibold text-gray-400 hidden sm:block">{item.sport}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
