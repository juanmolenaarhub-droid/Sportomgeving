'use client'

import Link from 'next/link'
import { ArrowLeft, ExternalLink, Instagram, Twitter, Heart } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const VERSION = '0.1.0-beta'

const LINKS = [
  { label: 'Privacybeleid', href: '#' },
  { label: 'Gebruiksvoorwaarden', href: '#' },
  { label: 'Contact', href: '#' },
]

export default function OverPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/instellingen" className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400">Instellingen › Over</p>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#111' }}>Over Buddys</h1>
        </div>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl border border-black/8 p-6 flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center shadow-lg">
          <span style={{ ...SYNE, fontWeight: 900, fontSize: 22, color: 'white' }}>B</span>
        </div>
        <div>
          <p style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#111' }}>Buddys</p>
          <p className="text-xs text-gray-400 mt-0.5">Versie {VERSION}</p>
        </div>
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
          Buddys is gebouwd in Nederland. Verbind sporters, vind je ideale trainingsbuddy en bereik je sportdoelen samen.
        </p>
      </div>

      {/* Links */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden divide-y divide-black/5">
        {LINKS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center justify-between px-5 py-4 hover:bg-[#F5F0E8] transition-colors group"
          >
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#111]">{label}</span>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#E87722] transition-colors" />
          </Link>
        ))}
      </div>

      {/* Social */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#111' }}>Volg ons</p>
        <div className="flex gap-3">
          {[
            { label: 'Instagram', icon: Instagram, href: '#' },
            { label: 'X / Twitter', icon: Twitter, href: '#' },
          ].map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 px-4 py-2.5 border border-black/10 rounded-xl text-sm font-semibold text-gray-600 hover:border-[#E87722] hover:text-[#111] transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <Link
            href="#"
            className="flex items-center gap-2 px-4 py-2.5 border border-black/10 rounded-xl text-sm font-semibold text-gray-600 hover:border-[#E87722] hover:text-[#111] transition-colors"
          >
            <span className="text-sm">TikTok</span>
          </Link>
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-[#F5F0E8] rounded-2xl p-5 text-center space-y-2">
        <p className="text-sm font-bold text-gray-800">Heb je feedback?</p>
        <p className="text-xs text-gray-500">
          Stuur ons een bericht via{' '}
          <Link href="mailto:hallo@buddys.nl" className="text-[#E87722] font-semibold hover:underline">
            hallo@buddys.nl
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 pb-2">
        <span className="text-xs text-gray-300">Gemaakt met</span>
        <Heart className="w-3 h-3 text-[#E87722]" />
        <span className="text-xs text-gray-300">in Nederland · {VERSION}</span>
      </div>
    </div>
  )
}
