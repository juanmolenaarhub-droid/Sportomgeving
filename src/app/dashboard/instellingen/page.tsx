'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  User, Settings, Shield, Bell, Dumbbell, Lock, Info, ChevronRight, ArrowLeft, LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const ITEMS = [
  {
    href: '/dashboard/instellingen/profiel',
    icon: User,
    title: 'Profiel',
    desc: 'Naam, foto, bio, locatie, sport',
  },
  {
    href: '/dashboard/instellingen/account',
    icon: Settings,
    title: 'Account',
    desc: 'E-mail, wachtwoord, abonnement',
  },
  {
    href: '/dashboard/instellingen/privacy',
    icon: Shield,
    title: 'Privacy',
    desc: 'Zichtbaarheid en wie jou kan vinden',
  },
  {
    href: '/dashboard/instellingen/notificaties',
    icon: Bell,
    title: 'Notificaties',
    desc: 'In-app en e-mail meldingen',
  },
  {
    href: '/dashboard/instellingen/sport',
    icon: Dumbbell,
    title: 'Sport',
    desc: 'Sport, niveau, beschikbaarheid',
  },
  {
    href: '/dashboard/instellingen/veiligheid',
    icon: Lock,
    title: 'Veiligheid',
    desc: 'Sessies en account beveiliging',
  },
  {
    href: '/dashboard/instellingen/over',
    icon: Info,
    title: 'Over Buddys',
    desc: 'App versie, beleid, contact',
  },
] as const

export default function InstellingenPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/profile/me"
          className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 22, color: '#1E2B20' }}>Instellingen</h1>
          <p className="text-sm text-gray-400">Beheer je account en voorkeuren</p>
        </div>
      </div>

      {/* Categoriekaarten */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden divide-y divide-black/5">
        {ITEMS.map(({ href, icon: Icon, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 px-5 py-4 hover:bg-[#F4F1E8] transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0 group-hover:bg-[#C4F542]/10 transition-colors">
              <Icon className="w-5 h-5 text-gray-500 group-hover:text-[#C4F542] transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ ...SYNE, fontWeight: 700, fontSize: 14, color: '#1E2B20' }}>{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Uitloggen */}
      <button
        onClick={handleLogout}
        className="w-full py-4 bg-white border border-red-100 text-red-500 font-bold text-sm rounded-2xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        Uitloggen
      </button>

      <p className="text-center text-xs text-gray-300 pb-4">Buddys · versie 1.0.0-beta</p>
    </div>
  )
}
