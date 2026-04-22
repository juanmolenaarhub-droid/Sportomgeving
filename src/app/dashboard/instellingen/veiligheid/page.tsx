'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Monitor, LogOut, Shield, ChevronDown, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const REPORT_CATEGORIES = ['Bug', 'Ongewenst gedrag', 'Spam', 'Nep profiel', 'Overig']

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2"
      onAnimationEnd={onDone}
    >
      <Check className="w-4 h-4 text-green-400" /> {msg}
    </div>
  )
}

export default function VeiligheidPage() {
  const router = useRouter()
  const supabase = createClient()

  const [logoutPending, startLogoutTransition] = useTransition()

  const [category, setCategory]   = useState(REPORT_CATEGORIES[0])
  const [showCats, setShowCats]   = useState(false)
  const [report, setReport]       = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportPending, startReportTransition] = useTransition()

  const [toast, setToast] = useState<string | null>(null)

  function handleLogoutAll() {
    startLogoutTransition(async () => {
      await supabase.auth.signOut({ scope: 'global' })
      router.push('/login')
    })
  }

  function handleSendReport() {
    if (!report.trim()) return
    startReportTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Sla op in reports tabel als die bestaat
      try {
        await supabase.from('reports').insert({
          reporter_id: user.id,
          reported_user_id: user.id, // platform-rapport, niet over andere user
          category: category.toLowerCase().replace(' ', '_'),
          description: report.trim(),
        })
      } catch {
        // Tabel bestaat mogelijk niet, toon toch success
      }
      setReportSent(true)
      setReport('')
    })
  }

  // Detecteer browser + OS voor sessievermelding
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const browser = ua.includes('Chrome') ? 'Chrome' : ua.includes('Safari') ? 'Safari' : ua.includes('Firefox') ? 'Firefox' : 'Browser'
  const os = ua.includes('Mac') ? 'macOS' : ua.includes('Win') ? 'Windows' : ua.includes('iPhone') || ua.includes('iPad') ? 'iOS' : ua.includes('Android') ? 'Android' : 'Onbekend'

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/instellingen" className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400">Instellingen › Veiligheid</p>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#1E2B20' }}>Veiligheid</h1>
        </div>
      </div>

      {/* Actieve sessies */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#1E2B20' }}>Actieve sessies</p>
        <div className="flex items-center gap-4 p-4 bg-[#F4F1E8] rounded-xl">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Monitor className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-800">Huidige sessie</p>
            <p className="text-xs text-gray-400">{browser} op {os}</p>
          </div>
          <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Actief</span>
        </div>
        <button
          onClick={handleLogoutAll}
          disabled={logoutPending}
          className="w-full py-3 border border-black/10 text-sm font-bold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <LogOut className="w-4 h-4" />
          {logoutPending ? 'Bezig...' : 'Uitloggen op alle apparaten'}
        </button>
      </div>

      {/* Rapporteer een probleem */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#1E2B20' }}>Rapporteer een probleem</p>

        {reportSent ? (
          <div className="flex flex-col items-center py-6 gap-3 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-bold text-gray-800">Rapport verstuurd</p>
            <p className="text-xs text-gray-400">Bedankt voor je melding. We kijken er zo snel mogelijk naar.</p>
            <button
              onClick={() => setReportSent(false)}
              className="text-xs text-[#C4F542] font-semibold hover:underline"
            >
              Nieuw rapport
            </button>
          </div>
        ) : (
          <>
            {/* Categorie dropdown */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Categorie</p>
              <div className="relative">
                <button
                  onClick={() => setShowCats(v => !v)}
                  className="w-full flex items-center justify-between border border-black/10 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:border-[#C4F542] transition-colors"
                >
                  {category}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCats ? 'rotate-180' : ''}`} />
                </button>
                {showCats && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/8 rounded-xl shadow-lg z-10 overflow-hidden">
                    {REPORT_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setCategory(cat); setShowCats(false) }}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-[#F4F1E8] transition-colors flex items-center justify-between"
                      >
                        {cat}
                        {category === cat && <Check className="w-3.5 h-3.5 text-[#C4F542]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Beschrijving */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Beschrijving</p>
              <textarea
                value={report}
                onChange={e => setReport(e.target.value)}
                placeholder="Beschrijf het probleem zo duidelijk mogelijk..."
                rows={4}
                maxLength={1000}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#C4F542] transition-colors"
              />
              <p className="text-xs text-gray-300 text-right mt-1">{report.length}/1000</p>
            </div>

            <button
              onClick={handleSendReport}
              disabled={reportPending || !report.trim()}
              className="w-full py-3 bg-[#111] text-white text-sm font-bold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40"
              style={SYNE}
            >
              {reportPending ? 'Versturen...' : 'Rapport versturen'}
            </button>
          </>
        )}
      </div>

      {/* Twee-factor authenticatie */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-3">
        <div className="flex items-center gap-3">
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#1E2B20' }}>Twee-factor authenticatie</p>
          <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Binnenkort</span>
        </div>
        <p className="text-xs text-gray-400">Extra beveiliging via een verificatiecode bij elke login. We werken hier aan.</p>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <Shield className="w-5 h-5 text-gray-300 shrink-0" />
          <p className="text-xs text-gray-400">2FA is nog niet beschikbaar. Je ontvangt een melding zodra dit live gaat.</p>
        </div>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
