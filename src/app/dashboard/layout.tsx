'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Users, LayoutList, MessageCircle, Bell, User, LogOut, Search, Play, Trophy, Flame } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/feed', label: 'Tijdlijn', icon: LayoutList },
  { href: '/dashboard/groups', label: 'Groepen', icon: Users },
  { href: '/dashboard/messages', label: 'Berichten', icon: MessageCircle, badge: 2 },
  { href: '/challenges', label: 'Challenges', icon: Trophy },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="Buddys" height={36} width={120} className="object-contain" />
          </Link>

          {/* Desktop navigatie */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon, badge }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    active ? 'bg-[#111111] text-white' : 'text-gray-500 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {badge && !active && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E87722] text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </Link>
              )
            })}
            {/* Creator Studio link */}
            <Link
              href="/dashboard/creator"
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                pathname.startsWith('/dashboard/creator')
                  ? 'bg-[#111111] text-white'
                  : 'text-gray-500 hover:text-black hover:bg-gray-50'
              }`}
            >
              <Flame className="w-4 h-4" />
              Creator Studio
            </Link>
            {/* Zoek buddies CTA */}
            <Link
              href="/dashboard/find"
              className={`relative flex items-center gap-2 ml-2 px-5 py-2 rounded-xl text-sm font-black transition-all ${
                pathname.startsWith('/dashboard/find')
                  ? 'bg-[#111] text-white'
                  : 'bg-[#111111] text-white hover:bg-[#E87722]'
              }`}
              style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '0.02em' }}
            >
              <Search className="w-4 h-4" />
              Zoek buddies
            </Link>
          </nav>

          {/* Rechts: notificaties + profiel + logout */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/notifications"
              className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E87722] rounded-full" />
            </Link>
            <Link
              href="/dashboard/profile/me"
              className="w-9 h-9 bg-[#111111] rounded-lg flex items-center justify-center"
            >
              <User className="w-5 h-5 text-white" />
            </Link>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              title="Uitloggen"
            >
              <LogOut className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Pagina inhoud */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 pb-28 md:pb-8">
        {children}
      </div>

      {/* Floating pill navigatie — alleen mobiel */}
      <style>{`
        @keyframes float-up {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .floating-nav {
          animation: float-up 0.35s cubic-bezier(.16,1,.3,1) both;
        }
      `}</style>
      <nav
        className="floating-nav md:hidden fixed z-50"
        style={{
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 390,
          background: 'rgba(17,17,17,0.97)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderRadius: 999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
          padding: '10px 12px',
        }}
      >
        <div className="flex items-center justify-between">
          {[
            { href: '/dashboard', icon: Home },
            { href: '/dashboard/feed', icon: Play },
            { href: '/challenges', icon: Trophy },
            { href: '/dashboard/messages', icon: MessageCircle, badge: 2 },
            { href: '/dashboard/notifications', icon: Bell, badge: 5 },
            { href: '/dashboard/find', icon: Search },
            { href: '/dashboard/profile/me', icon: User },
          ].map(({ href, icon: Icon, badge }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="relative flex items-center justify-center w-10 h-10"
              >
                <Icon
                  className="w-[18px] h-[18px] transition-colors duration-200"
                  style={{ color: active ? 'white' : 'rgba(255,255,255,0.6)' }}
                />
                {badge && !active && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-[#E87722] text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
                    {badge}
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
