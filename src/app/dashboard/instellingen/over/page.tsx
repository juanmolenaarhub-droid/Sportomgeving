'use client'

import Link from 'next/link'
import { ArrowLeft, ExternalLink, Heart } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const VERSION = '0.1.0-beta'

const LINKS = [
  { label: 'Privacybeleid', href: '/privacybeleid' },
  { label: 'Gebruiksvoorwaarden', href: '/gebruiksvoorwaarden' },
  { label: 'Contact', href: 'mailto:hallo@buddys.nl' },
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
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#1E2B20' }}>Over Buddys</h1>
        </div>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl border border-black/8 p-6 flex flex-col items-center text-center space-y-3">
        <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center shadow-lg">
          <span style={{ ...SYNE, fontWeight: 900, fontSize: 22, color: 'white' }}>B</span>
        </div>
        <div>
          <p style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#1E2B20' }}>Buddys</p>
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
            className="flex items-center justify-between px-5 py-4 hover:bg-[#F4F1E8] transition-colors group"
          >
            <span className="text-sm font-semibold text-gray-700 group-hover:text-[#111]">{label}</span>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-[#C4F542] transition-colors" />
          </Link>
        ))}
      </div>

      {/* Social */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#1E2B20' }}>Volg ons</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Instagram', href: 'https://instagram.com/buddysnl' },
            { label: 'X / Twitter', href: 'https://twitter.com/buddysnl' },
            { label: 'TikTok', href: 'https://tiktok.com/@buddysnl' },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 border border-black/10 rounded-xl text-sm font-semibold text-gray-600 hover:border-[#C4F542] hover:text-[#111] transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>

      {/* Feedback */}
      <div className="bg-[#F4F1E8] rounded-2xl p-5 text-center space-y-2">
        <p className="text-sm font-bold text-gray-800">Heb je feedback?</p>
        <p className="text-xs text-gray-500">
          Stuur ons een bericht via{' '}
          <Link href="mailto:hallo@buddys.nl" className="text-[#C4F542] font-semibold hover:underline">
            hallo@buddys.nl
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-1.5 pb-2">
        <span className="text-xs text-gray-300">Gemaakt met</span>
        <Heart className="w-3 h-3 text-[#C4F542]" />
        <span className="text-xs text-gray-300">in Nederland · {VERSION}</span>
      </div>
    </div>
  )
}
