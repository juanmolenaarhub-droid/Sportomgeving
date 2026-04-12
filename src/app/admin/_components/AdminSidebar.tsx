'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, GitMerge, Zap, Users, Server, Menu, X, LogOut, ShieldAlert, MapPin
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin', label: 'Overzicht', icon: LayoutDashboard },
  { href: '/admin/groei', label: 'Groei', icon: TrendingUp },
  { href: '/admin/matching', label: 'Matching', icon: GitMerge },
  { href: '/admin/engagement', label: 'Engagement', icon: Zap },
  { href: '/admin/gebruikers', label: 'Gebruikers', icon: Users },
  { href: '/admin/platform', label: 'Platform', icon: Server },
  { href: '/admin/meetups', label: 'Meetups', icon: MapPin },
  { href: '/admin/issues', label: 'Meldingen', icon: ShieldAlert },
]

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavLinks = () => (
    <>
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              active
                ? 'bg-[#111111] text-white'
                : 'text-gray-500 hover:text-black hover:bg-black/5'
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-screen bg-[#F5F0E8] border-r border-black/8 sticky top-0">
        <div className="px-6 py-5 border-b border-black/8">
          <Link href="/admin">
            <Image src="/logo.png" alt="Buddys" height={26} width={90} className="object-contain" />
          </Link>
          <p style={{ ...SYNE, fontSize: 10, fontWeight: 800, letterSpacing: '0.18em' }} className="text-[#E87722] uppercase mt-2">
            Admin
          </p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLinks />
        </nav>
        <div className="px-3 py-4 border-t border-black/8">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-black hover:bg-black/5 transition-all">
            ← Terug naar app
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all mt-1"
          >
            <LogOut className="w-4 h-4" />
            Uitloggen
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#F5F0E8]/95 backdrop-blur-sm border-b border-black/8 h-14 flex items-center justify-between px-5">
        <Link href="/admin">
          <Image src="/logo.png" alt="Buddys" height={22} width={76} className="object-contain" />
        </Link>
        <button
          onClick={() => setMobileOpen(v => !v)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 bg-[#F5F0E8] min-h-screen pt-16 flex flex-col shadow-2xl">
            <nav className="flex-1 px-3 py-4 space-y-1">
              <NavLinks />
            </nav>
            <div className="px-3 py-4 border-t border-black/8">
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-black hover:bg-black/5 transition-all">
                ← Terug naar app
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all mt-1">
                <LogOut className="w-4 h-4" /> Uitloggen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
