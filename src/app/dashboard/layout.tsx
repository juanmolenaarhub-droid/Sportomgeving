'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Users, LayoutList, MessageCircle, Bell, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/find', label: 'Zoek een Buddy', icon: Search },
  { href: '/dashboard/groups', label: 'Groepen', icon: Users },
  { href: '/dashboard/feed', label: 'Tijdlijn', icon: LayoutList },
  { href: '/dashboard/messages', label: 'Berichten', icon: MessageCircle, badge: 2 },
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
                    active ? 'bg-[#E87722] text-white' : 'text-gray-500 hover:text-black hover:bg-gray-50'
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
              className="w-9 h-9 bg-[#E87722] rounded-lg flex items-center justify-center"
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
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 pb-24 md:pb-8">
        {children}
      </div>

      {/* Mobiele bottom navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30">
        <div className="flex">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${
                  active ? 'text-[#E87722]' : 'text-gray-400 hover:text-[#E87722]'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {badge && !active && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 bg-[#E87722] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
