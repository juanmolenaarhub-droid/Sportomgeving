'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Home, Users, Rss, MessageCircle, Bell, User,
  LogOut, Search, MapPin, Settings,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Avatar } from '@/components/Avatar'

const NAV_ITEMS = [
  { href: '/dashboard',          label: 'Home',      icon: Home,          exact: true  },
  { href: '/dashboard/feed',     label: 'Feed',      icon: Rss,           exact: false },
  { href: '/dashboard/meetup',   label: 'Meetup',    icon: MapPin,        exact: false },
  { href: '/dashboard/messages', label: 'Berichten', icon: MessageCircle, exact: false },
  { href: '/dashboard/groups',   label: 'Groepen',   icon: Users,         exact: false },
] as const

const MOBILE_ITEMS = [
  { href: '/dashboard',           icon: Home,          label: 'Home',      exact: true  },
  { href: '/dashboard/meetup',    icon: MapPin,        label: 'Meetup',    exact: false },
  { href: '/dashboard/find',      icon: Search,        label: 'Zoeken',    exact: false },
  { href: '/dashboard/messages',  icon: MessageCircle, label: 'Berichten', exact: false },
  { href: '/dashboard/profile/me', icon: User,         label: 'Profiel',   exact: false },
] as const

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const [profileName,     setProfileName]     = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [unreadMessages,  setUnreadMessages]  = useState(0)
  const [hasMeetupDot,    setHasMeetupDot]    = useState(false)
  const [hasNotifDot,     setHasNotifDot]     = useState(false)
  const [showDropdown,    setShowDropdown]    = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const userIdRef   = useRef<string>('')
  const cityRef     = useRef<string>('')

  const loadBadges = useCallback(async (uid: string, city: string) => {
    // Accepted conversation IDs
    const { data: convs } = await supabase
      .from('follow_requests')
      .select('id')
      .or(`from_user_id.eq.${uid},to_user_id.eq.${uid}`)
      .eq('status', 'accepted')

    const convIds = (convs ?? []).map((c: { id: string }) => c.id)
    const since24h = new Date(Date.now() - 86400000).toISOString()

    const [msgRes, meetupRes, notifRes] = await Promise.all([
      convIds.length > 0
        ? supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', convIds)
            .neq('sender_id', uid)
            .is('read_at', null)
        : Promise.resolve({ count: 0 }),
      city
        ? supabase
            .from('meetups')
            .select('*', { count: 'exact', head: true })
            .ilike('city', `%${city}%`)
            .gte('created_at', since24h)
            .eq('status', 'open')
        : Promise.resolve({ count: 0 }),
      supabase
        .from('system_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('read', false),
    ])

    setUnreadMessages((msgRes as { count: number | null }).count ?? 0)
    setHasMeetupDot(((meetupRes as { count: number | null }).count ?? 0) > 0)
    setHasNotifDot(((notifRes as { count: number | null }).count ?? 0) > 0)
  }, [supabase])

  useEffect(() => {
    let cleanup: (() => void) | undefined

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      userIdRef.current = user.id

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, city')
        .eq('id', user.id)
        .single()

      const name = profile?.full_name ?? profile?.username ?? 'Gebruiker'
      const city = profile?.city ?? ''
      setProfileName(name)
      setProfileImageUrl(profile?.avatar_url ?? null)
      cityRef.current = city

      await loadBadges(user.id, city)

      // Realtime subscriptions for badge refresh
      const channel = supabase
        .channel('layout-badges')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          () => loadBadges(user.id, city))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
          () => loadBadges(user.id, city))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meetups' },
          () => loadBadges(user.id, city))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_notifications' },
          () => loadBadges(user.id, city))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_notifications' },
          () => loadBadges(user.id, city))
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => { cleanup?.() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col">
      {/* ── Topbar ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-black/8 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link
            href="/dashboard"
            style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 20, color: '#111', letterSpacing: '-0.02em' }}
          >
            Buddys
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    active ? 'bg-[#111111] text-white' : 'text-gray-500 hover:text-black hover:bg-black/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}

                  {/* Unread messages badge */}
                  {href === '/dashboard/messages' && unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#E87722] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}

                  {/* New meetups dot */}
                  {href === '/dashboard/meetup' && hasMeetupDot && !active && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#E87722] rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Right: Vind buddy CTA + Bell + Avatar */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/find"
              className="hidden md:flex items-center gap-2 bg-[#111111] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#E87722] transition-colors shrink-0"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <Search className="w-3.5 h-3.5" />
              Vind buddy
            </Link>

            <Link
              href="/dashboard/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-500" />
              {hasNotifDot && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E87722] rounded-full" />
              )}
            </Link>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(v => !v)}
                className="rounded-full overflow-hidden hover:ring-2 hover:ring-[#E87722] transition-all focus:outline-none"
              >
                <Avatar name={profileName || 'G'} imageUrl={profileImageUrl} size="sm" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-12 z-50 bg-white rounded-2xl shadow-xl border border-black/8 overflow-hidden w-52">
                  {/* Name header */}
                  <div className="px-4 py-3 border-b border-black/5">
                    <p className="text-xs text-gray-400 font-medium">Ingelogd als</p>
                    <p className="text-sm font-bold text-black truncate">{profileName}</p>
                  </div>

                  <Link
                    href="/dashboard/profile/me"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-[#F5F0E8] transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" /> Mijn profiel
                  </Link>

                  <Link
                    href="/dashboard/instellingen"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-[#F5F0E8] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" /> Instellingen
                  </Link>

                  <div className="border-t border-black/5" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" /> Uitloggen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 pb-28 md:pb-8">
        {children}
      </div>

      {/* ── Floating mobile pill ────────────────────────────────────────── */}
      <style>{`
        @keyframes float-up {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .floating-nav { animation: float-up 0.35s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      <nav
        className="floating-nav md:hidden fixed z-50"
        style={{
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100vw - 32px)',
          maxWidth: 390,
          background: 'rgba(17,17,17,0.97)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          padding: '8px 16px',
        }}
      >
        <div className="flex items-center justify-around">
          {MOBILE_ITEMS.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className="relative flex flex-col items-center gap-0.5 py-1 px-2 min-w-[44px]"
              >
                <Icon
                  className="w-5 h-5 transition-colors duration-200"
                  style={{ color: active ? 'white' : 'rgba(255,255,255,0.5)' }}
                />
                <span
                  className="font-bold transition-all duration-200"
                  style={{
                    fontSize: 9,
                    lineHeight: '1.2',
                    color: active ? 'white' : 'transparent',
                  }}
                >
                  {label}
                </span>
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                )}
                {/* Unread badge */}
                {href === '/dashboard/messages' && unreadMessages > 0 && (
                  <span className="absolute -top-1 right-0.5 min-w-[14px] h-[14px] bg-[#E87722] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
