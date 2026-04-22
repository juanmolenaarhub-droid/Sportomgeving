'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import Link from 'next/link'
import { MapPin, X, ArrowRight, UserPlus, Check, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type MiniProfile = {
  id: string
  name: string
  username?: string
  region?: string
  bio?: string
  avatarUrl?: string
  sports?: { label: string; level: string }[]
}

// ── Context ────────────────────────────────────────────────────────────────────

type ProfileCardContextType = {
  openProfile: (userId: string) => void
}

const ProfileCardContext = createContext<ProfileCardContextType>({ openProfile: () => {} })

export function useProfileCard() {
  return useContext(ProfileCardContext)
}

// ── Avatar initialen ───────────────────────────────────────────────────────────

function MiniAvatar({ name, url, size = 'md' }: { name: string; url?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'md' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} rounded-full bg-[#F4F1E8] overflow-hidden flex items-center justify-center shrink-0`}>
      {url
        ? <img src={url} className="w-full h-full object-cover" alt="" />
        : <span style={{ ...SYNE, fontWeight: 900, color: '#C4F542' }}>{name.charAt(0).toUpperCase()}</span>
      }
    </div>
  )
}

function levelStyle(level: string) {
  const l = level?.toLowerCase()
  if (l === 'gevorderd' || l === 'advanced') return 'bg-black text-white'
  if (l === 'gemiddeld' || l === 'intermediate') return 'bg-[#C4F542] text-white'
  return 'bg-gray-100 text-gray-500'
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function ProfileCardModalInner({
  userId,
  currentUserId,
  onClose,
}: {
  userId: string
  currentUserId: string
  onClose: () => void
}) {
  const [profile, setProfile] = useState<MiniProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [followState, setFollowState] = useState<'none' | 'pending' | 'accepted'>('none')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      // Probeer via API route (bypast RLS)
      try {
        const res = await fetch(`/api/profile/${userId}`)
        if (res.ok) {
          const { profile: p } = await res.json()
          if (p) {
            const supabase = createClient()
            const levelLabel: Record<string, string> = { beginner: 'Beginner', intermediate: 'Gemiddeld', advanced: 'Gevorderd' }
            const { data: userSports } = await supabase
              .from('user_sports').select('level, sports(name)').eq('user_id', userId)
            const { data: req } = await supabase
              .from('follow_requests').select('status')
              .eq('from_user_id', currentUserId).eq('to_user_id', userId)
              .neq('status', 'declined').maybeSingle()

            setProfile({
              id: p.id,
              name: p.full_name ?? p.username ?? 'Onbekend',
              username: p.username ?? undefined,
              region: p.region ?? '',
              bio: p.bio ?? '',
              avatarUrl: p.avatar_url ?? undefined,
              sports: (userSports ?? []).map((s: any) => ({
                label: (Array.isArray(s.sports) ? s.sports[0]?.name : s.sports?.name) ?? 'Sport',
                level: levelLabel[s.level] ?? s.level,
              })),
            })
            if (req?.status === 'accepted') setFollowState('accepted')
            else if (req?.status === 'pending') setFollowState('pending')
            setLoading(false)
            return
          }
        }
      } catch (_) {}
      setLoading(false)
    }
    load()
  }, [userId, currentUserId])

  async function handleFollow() {
    setSending(true)
    const supabase = createClient()
    await supabase.from('follow_requests').upsert({
      from_user_id: currentUserId,
      to_user_id: userId,
      status: 'pending',
    }, { onConflict: 'from_user_id,to_user_id' })
    setFollowState('pending')
    setSending(false)
  }

  const isOwn = userId === currentUserId

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 15 }}>Profiel</p>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="px-5 py-6 flex items-center gap-4 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-gray-100 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-100 rounded w-32" />
              <div className="h-3 bg-gray-100 rounded w-20" />
            </div>
          </div>
        ) : !profile ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">Profiel niet beschikbaar</div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            {/* Profiel info */}
            <div className="flex items-center gap-4">
              <MiniAvatar name={profile.name} url={profile.avatarUrl} size="lg" />
              <div className="flex-1 min-w-0">
                <p style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#1E2B20' }} className="truncate">{profile.name}</p>
                {profile.username && <p className="text-xs text-gray-400">@{profile.username}</p>}
                {profile.region && (
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <MapPin className="w-3 h-3" />{profile.region}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{profile.bio}</p>
            )}

            {/* Sports */}
            {(profile.sports ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.sports!.slice(0, 3).map(s => (
                  <div key={s.label} className="flex items-center gap-1.5 bg-gray-50 rounded-xl px-3 py-1.5">
                    <span className="text-xs font-semibold text-gray-700">{s.label}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${levelStyle(s.level)}`}>{s.level}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Acties */}
            <div className="flex gap-2 pt-1">
              {!isOwn && followState === 'none' && (
                <button
                  onClick={handleFollow}
                  disabled={sending}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-black text-white text-sm font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  {sending ? 'Verzenden...' : 'Buddy verzoek'}
                </button>
              )}
              {!isOwn && followState === 'pending' && (
                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-bold">
                  <Send className="w-4 h-4" /> Verzoek verzonden
                </div>
              )}
              {!isOwn && followState === 'accepted' && (
                <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold">
                  <Check className="w-4 h-4" /> Buddies
                </div>
              )}

              <Link
                href={`/dashboard/profile/${profile.id}`}
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#F4F1E8] text-black text-sm font-bold hover:bg-[#ede7dc] transition-colors group"
              >
                Volledig profiel
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function ProfileCardProvider({
  children,
  currentUserId,
}: {
  children: React.ReactNode
  currentUserId: string
}) {
  const [activeUserId, setActiveUserId] = useState<string | null>(null)

  const openProfile = useCallback((userId: string) => {
    setActiveUserId(userId)
  }, [])

  return (
    <ProfileCardContext.Provider value={{ openProfile }}>
      {children}
      {activeUserId && (
        <ProfileCardModalInner
          userId={activeUserId}
          currentUserId={currentUserId}
          onClose={() => setActiveUserId(null)}
        />
      )}
    </ProfileCardContext.Provider>
  )
}
