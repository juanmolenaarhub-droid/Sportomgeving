'use client'

import Link from 'next/link'
import { Check, Zap, Crown } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const FREE_FEATURES = [
  'Profiel aanmaken',
  'Max. 10 buddy verzoeken per maand',
  'Deelnemen aan meetups',
  'Lid worden van groepen',
  'Berichten sturen',
  'Posts en activiteiten delen',
]

const PRO_FEATURES = [
  'Alles van Gratis',
  'Onbeperkte buddy verzoeken',
  'Verified badge op je profiel',
  'Uitgebreide profielanalytics',
  'Prioriteit in zoekresultaten',
  'Vroeg toegang tot nieuwe functies',
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-3xl w-full">

        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/dashboard" style={{ ...SYNE, fontWeight: 900, fontSize: 22, color: '#111' }} className="inline-block mb-8">
            Buddys
          </Link>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 36, color: '#111', lineHeight: 1.1 }} className="mb-4">
            Kies jouw plan
          </h1>
          <p className="text-gray-500 text-base max-w-md mx-auto">
            Begin gratis en upgrade wanneer je meer uit Buddys wilt halen.
          </p>
        </div>

        {/* Plans */}
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Gratis */}
          <div className="bg-white rounded-3xl border border-black/8 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p style={{ ...SYNE, fontWeight: 800, fontSize: 18, color: '#111' }}>Gratis</p>
                <p className="text-2xl font-black text-black">€0 <span className="text-sm font-normal text-gray-400">/ maand</span></p>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard"
              className="block w-full py-3 rounded-xl border-2 border-black/10 text-sm font-bold text-center text-gray-700 hover:bg-gray-50 transition-colors"
              style={SYNE}
            >
              Huidige plan
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-[#111] rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#E87722]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-10 h-10 bg-[#E87722] rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p style={{ ...SYNE, fontWeight: 800, fontSize: 18, color: 'white' }}>Pro</p>
                <p className="text-2xl font-black text-white">€4,99 <span className="text-sm font-normal text-white/50">/ maand</span></p>
              </div>
            </div>

            <ul className="space-y-3 mb-8 relative">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-white/80">
                  <Check className="w-4 h-4 text-[#E87722] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              className="relative w-full py-3 rounded-xl bg-[#E87722] text-white text-sm font-bold hover:bg-[#d06a1a] transition-colors"
              style={SYNE}
              onClick={() => alert('Pro-abonnementen komen binnenkort beschikbaar!')}
            >
              Binnenkort beschikbaar
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Vragen? Mail naar{' '}
          <a href="mailto:hallo@buddys.nl" className="text-[#E87722] hover:underline font-semibold">
            hallo@buddys.nl
          </a>
        </p>
      </div>
    </div>
  )
}
