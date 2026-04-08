'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserPlus, MapPin, Award, ArrowRight } from 'lucide-react'
import { StoryAvatar, type StoryPost } from '@/components/StoryAvatar'
import { ProfileHeader } from '@/components/ProfileHeader'
import { createClient } from '@/lib/supabase'

const following = [
  { name: 'Tim van Berg', sport: 'Hardlopen', region: 'Amsterdam', level: 'Gevorderd',
    post: { id: 'p1', user: { name: 'Tim van Berg', region: 'Amsterdam' }, content: 'Geweldige ochtendrun door het Vondelpark.', activity_type: 'run', activity_label: 'Hardlopen', distance_km: 10.4, duration_minutes: 52, image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80', likes_count: 24, comments_count: 5, created_at: '2 min geleden' } as StoryPost },
  { name: 'Sarah Jansen', sport: 'Fietsen', region: 'Utrecht', level: 'Gemiddeld',
    post: { id: 'p2', user: { name: 'Sarah Jansen', region: 'Utrecht' }, content: '45km gefietst langs de Vecht.', activity_type: 'cycle', activity_label: 'Fietsen', distance_km: 45, duration_minutes: 105, image_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80', likes_count: 41, comments_count: 8, created_at: '1 uur geleden' } as StoryPost },
  { name: 'Marco de Wit', sport: 'Gym', region: 'Rotterdam', level: 'Gevorderd',
    post: { id: 'p3', user: { name: 'Marco de Wit', region: 'Rotterdam' }, content: 'PR vandaag op deadlift: 160kg.', activity_type: 'gym', activity_label: 'Gym', likes_count: 67, comments_count: 12, created_at: '3 uur geleden' } as StoryPost },
  { name: 'Lisa Hoek', sport: 'Yoga', region: 'Amsterdam', level: 'Gevorderd',
    post: { id: 'p4', user: { name: 'Lisa Hoek', region: 'Amsterdam' }, content: 'Yoga in het park. Wie wil volgende week ook komen?', activity_type: 'yoga', activity_label: 'Yoga', image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', likes_count: 89, comments_count: 21, created_at: 'Gisteren' } as StoryPost },
  { name: 'Kevin Smit', sport: 'Voetbal', region: 'Den Haag', level: 'Gemiddeld', post: null },
  { name: 'Anna de Boer', sport: 'Zwemmen', region: 'Amsterdam', level: 'Gevorderd', post: null },
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

        <Link href="/dashboard/find" className="flex items-center justify-between bg-[#E87722] text-white rounded-2xl p-5 hover:bg-[#d06a1a] transition-colors group">
          <div>
            <p className="font-black">Zoek een buddy</p>
            <p className="text-sm text-white/70 mt-0.5">Vind sporters in jouw buurt</p>
          </div>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
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
            <div key={person.name} className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#E87722] hover:shadow-sm transition-all group">
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
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-black text-black">Recente activiteit</h3>
            <Link href="/dashboard/feed" className="text-sm text-[#E87722] font-semibold hover:underline">Naar tijdlijn</Link>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Tim van Berg', action: 'heeft een 10km run gedeeld', sport: 'Hardlopen', time: '2 min geleden' },
              { name: 'Sarah Jansen', action: 'heeft zich aangesloten bij Cycling Amsterdam', sport: 'Fietsen', time: '1 uur geleden' },
              { name: 'Marco de Wit', action: 'heeft een nieuwe training gepost', sport: 'Gym', time: '3 uur geleden' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                <StoryAvatar name={item.name} size="sm" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700"><span className="font-bold text-black">{item.name}</span> {item.action}</p>
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
