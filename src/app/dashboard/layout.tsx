'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Home, Users, MessageCircle, Bell, User,
  LogOut, Search, MapPin, Settings, Play,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Avatar } from '@/components/Avatar'
import { ProfileCardProvider } from '@/components/ProfileCardModal'
import { CreateActionSheet } from '@/components/feed/CreateActionSheet'
import PostComposer from './_components/PostComposer'

const NAV_ITEMS = [
  { href: '/dashboard',          label: 'Home',      icon: Home,          exact: true  },
  { href: '/dashboard/videos',   label: 'Videos',    icon: Play,          exact: false },
  { href: '/dashboard/meetup',   label: 'Meetup',    icon: MapPin,        exact: false },
  { href: '/dashboard/messages', label: 'Berichten', icon: MessageCircle, exact: false },
  { href: '/dashboard/groups',   label: 'Groepen',   icon: Users,         exact: false },
] as const

// ─── Mobile nav items (6 items, geen center plus) ─────────────────────────────

const MOBILE_NAV_ITEMS = [
  { href: '/dashboard/feed',        icon: Home,          label: 'Home',    exact: true  },
  { href: '/dashboard/videos',      icon: Play,          label: 'Play',    exact: false },
  { href: '/dashboard/find',        icon: Search,        label: 'Zoek',    exact: false },
  { href: '/dashboard/meetup',      icon: MapPin,        label: 'Meetups', exact: false },
  { href: '/dashboard/messages',    icon: MessageCircle, label: 'Berichten', exact: false },
  { href: '/dashboard/profile/me',  icon: User,          label: 'Profiel', exact: false },
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
  const [currentUserId,   setCurrentUserId]   = useState('')

  // Create-sheet + PostComposer state (beschikbaar via desktop nav)
  const [showCreateSheet, setShowCreateSheet] = useState(false)
  const [composerOpen,    setComposerOpen]    = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const userIdRef   = useRef<string>('')
  const regionRef   = useRef<string>('')

  const isFeedPage   = pathname === '/dashboard/feed'
  const isVideosPage = pathname === '/dashboard/videos'
  const isImmersive  = isFeedPage || isVideosPage

  const loadBadges = useCallback(async (uid: string, region: string) => {
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
      region
        ? supabase
            .from('meetups')
            .select('*', { count: 'exact', head: true })
            .ilike('region', `%${region}%`)
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
      setCurrentUserId(user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url, region')
        .eq('id', user.id)
        .single()

      const name   = profile?.full_name ?? profile?.username ?? 'Gebruiker'
      const region = profile?.region ?? ''
      setProfileName(name)
      const rawUrl = profile?.avatar_url ?? null
      setProfileImageUrl(rawUrl ? `${rawUrl}?t=${Date.now()}` : null)
      regionRef.current = region

      await loadBadges(user.id, region)

      const channel = supabase
        .channel('layout-badges')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            const p = payload.new as { full_name?: string; username?: string; avatar_url?: string }
            if (p.full_name || p.username) setProfileName(p.full_name ?? p.username ?? name)
            if (p.avatar_url) setProfileImageUrl(`${p.avatar_url}?t=${Date.now()}`)
          })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          () => loadBadges(user.id, region))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
          () => loadBadges(user.id, region))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'meetups' },
          () => loadBadges(user.id, region))
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_notifications' },
          () => loadBadges(user.id, region))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_notifications' },
          () => loadBadges(user.id, region))
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => { cleanup?.() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <div className={`bg-[#F5F0E8] flex flex-col ${pathname === '/dashboard/videos' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>

      {/* ── Topbar — verborgen op mobile feed pagina ────────────────────── */}
      <header
        className={`${isImmersive ? 'hidden md:block' : 'block'} bg-white border-b border-black/8 sticky top-0 z-30`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          <Link href="/dashboard/feed">
            <Image src="/logo.png" alt="Buddys" height={36} width={120} className="object-contain" />
          </Link>

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

                  {href === '/dashboard/messages' && unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#E87722] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}

                  {href === '/dashboard/meetup' && hasMeetupDot && !active && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#E87722] rounded-full" />
                  )}
                </Link>
              )
            })}
          </nav>

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

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(v => !v)}
                className="rounded-full overflow-hidden hover:ring-2 hover:ring-[#E87722] transition-all focus:outline-none"
              >
                <Avatar name={profileName || 'G'} imageUrl={profileImageUrl} size="sm" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-12 z-50 bg-white rounded-2xl shadow-xl border border-black/8 overflow-hidden w-52">
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
      {(pathname === '/dashboard/videos' || isFeedPage) ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <ProfileCardProvider currentUserId={currentUserId}>
            {children}
          </ProfileCardProvider>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 pb-safe-nav md:pb-8">
          <ProfileCardProvider currentUserId={currentUserId}>
            {children}
          </ProfileCardProvider>
        </div>
      )}

      {/* ── Bottom nav — verborgen op videos pagina ──────────────────────── */}
      <div
        className={`md:hidden fixed z-50 left-0 right-0${pathname === '/dashboard/videos' ? ' hidden' : ''}`}
        style={{
          bottom: 0,
          background: '#FFFFFF',
          borderRadius: '20px 20px 0 0',
          boxShadow: '0 -4px 24px rgba(26,23,20,0.10)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Nav items — 6 gelijke items */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 4px 6px',
        }}>
          {MOBILE_NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => (
            <BottomNavItem
              key={href}
              href={href}
              icon={<Icon style={{ width: 20, height: 20 }} />}
              label={label}
              active={isActive(href, exact)}
              badge={href === '/dashboard/messages' ? unreadMessages : 0}
            />
          ))}
        </nav>
      </div>

      {/* ── CreateActionSheet ───────────────────────────────────────────── */}
      <CreateActionSheet
        open={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onNewPost={() => setComposerOpen(true)}
      />

      {/* ── PostComposer (vanuit layout — beschikbaar op alle routes) ────── */}
      <PostComposer
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPosted={async () => { router.refresh() }}
      />
    </div>
  )
}

// ─── Bottom nav item ───────────────────────────────────────────────────────────

function BottomNavItem({
  href,
  icon,
  label,
  active,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  badge?: number
}) {
  return (
    <Link
      href={href}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
        padding: '2px 4px',
        position: 'relative',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Icoon — actief: oranje bg pill */}
      <div style={{
        width: 44, height: 34,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 12,
        background: active ? 'rgba(232,119,34,0.12)' : 'transparent',
        transition: 'background 150ms',
      }}>
        <span style={{ color: active ? '#E87722' : '#9CA3AF' }}>{icon}</span>
      </div>

      {/* Label */}
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        color: active ? '#E87722' : '#9CA3AF',
        lineHeight: 1,
      }}>
        {label}
      </span>

      {/* Badge */}
      {(badge ?? 0) > 0 && (
        <span style={{
          position: 'absolute', top: 2, right: '20%',
          minWidth: 16, height: 16,
          background: '#E87722',
          color: 'white',
          fontSize: 9,
          fontWeight: 900,
          borderRadius: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 3px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {(badge ?? 0) > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
