'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { updateSportSettings } from '@/app/actions/settings'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const SPORTS = [
  'Hardlopen', 'Fietsen', 'Zwemmen', 'Gym',
  'Voetbal', 'Tennis', 'Padel', 'Yoga',
  'Boksen', 'Klimmen', 'Triathlon', 'Overig',
]

const NIVEAUS: { value: 'beginner' | 'intermediate' | 'advanced'; label: string }[] = [
  { value: 'beginner',     label: 'Beginner'  },
  { value: 'intermediate', label: 'Gemiddeld' },
  { value: 'advanced',     label: 'Gevorderd' },
]

const DAYS  = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const TIMES = ['Ochtend', 'Middag', 'Avond']

type SportEntry = { sport: string; niveau: 'beginner' | 'intermediate' | 'advanced' }

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
      <Check className="w-4 h-4 text-green-400" /> {msg}
    </div>
  )
}

export default function SportInstellingenPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading]         = useState(true)
  const [toast, setToast]             = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)

  // Array van geselecteerde sporten, elk met eigen niveau
  const [selectedSports, setSelectedSports] = useState<SportEntry[]>([])
  const [beschikbaarheid, setBeschikbaarheid] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: userSports }] = await Promise.all([
        supabase.from('profiles').select('beschikbaarheid').eq('id', user.id).single(),
        supabase.from('user_sports').select('level, sports(name)').eq('user_id', user.id),
      ])

      if (prof) setBeschikbaarheid((prof.beschikbaarheid as string[]) ?? [])

      if (userSports && userSports.length > 0) {
        const entries: SportEntry[] = userSports.map((s: any) => {
          const name = Array.isArray(s.sports) ? s.sports[0]?.name : s.sports?.name
          return { sport: name ?? '', niveau: s.level as SportEntry['niveau'] }
        }).filter((e: SportEntry) => e.sport)
        setSelectedSports(entries)
      }

      setLoading(false)
    }
    load()
  }, [])

  function toggleSport(sport: string) {
    setSelectedSports(prev => {
      const exists = prev.find(e => e.sport === sport)
      if (exists) return prev.filter(e => e.sport !== sport)
      return [...prev, { sport, niveau: 'intermediate' }]
    })
  }

  function setNiveau(sport: string, niveau: SportEntry['niveau']) {
    setSelectedSports(prev =>
      prev.map(e => e.sport === sport ? { ...e, niveau } : e)
    )
  }

  function toggleSlot(day: string, time: string) {
    const val = `${day.toLowerCase()}_${time.toLowerCase()}`
    setBeschikbaarheid(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    )
  }

  function isActive(day: string, time: string) {
    return beschikbaarheid.includes(`${day.toLowerCase()}_${time.toLowerCase()}`)
  }

  function handleSave() {
    setError(null)
    // Primaire sport = eerste geselecteerde sport (of lege string als geen)
    const primaireSport = selectedSports[0]?.sport ?? ''
    const primaireNiveau = selectedSports[0]?.niveau ?? 'intermediate'

    startTransition(async () => {
      const res = await updateSportSettings({
        sport: primaireSport,
        niveau: primaireNiveau,
        beschikbaarheid,
      })
      if (res.success) setToast('Instellingen opgeslagen!')
      else setError(res.error ?? 'Er ging iets mis')
    })
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto py-12 flex justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#E87722] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/instellingen" className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400">Instellingen › Sport</p>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#111' }}>Sport & beschikbaarheid</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      )}

      {/* Sport tegels */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <div>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#111' }}>Jouw sporten & niveaus</p>
          <p className="text-xs text-gray-400 mt-0.5">Selecteer alle sporten die je doet en geef per sport je niveau aan.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SPORTS.map(sport => {
            const entry = selectedSports.find(e => e.sport === sport)
            const isSelected = !!entry

            return (
              <button
                key={sport}
                onClick={() => toggleSport(sport)}
                className="relative flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor: isSelected ? '#E87722' : 'rgba(0,0,0,0.08)',
                  background: isSelected ? '#FFF8F4' : 'white',
                }}
              >
                {/* Overlay als niet geselecteerd */}
                {!isSelected && (
                  <div className="absolute inset-0 rounded-xl bg-white/60 z-10 pointer-events-none" />
                )}

                {/* Sportnaam */}
                <span
                  style={{
                    ...SYNE,
                    fontWeight: 700,
                    fontSize: 13,
                    color: isSelected ? '#111' : '#6B7280',
                    marginBottom: 10,
                  }}
                >
                  {sport}
                </span>

                {/* Niveau pills */}
                <div className="flex gap-1 w-full" onClick={e => e.stopPropagation()}>
                  {NIVEAUS.map(n => {
                    const active = isSelected && entry?.niveau === n.value
                    return (
                      <button
                        key={n.value}
                        disabled={!isSelected}
                        onClick={() => setNiveau(sport, n.value)}
                        className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all"
                        style={{
                          background: active ? '#E87722' : '#F3F4F6',
                          color: active ? 'white' : '#9CA3AF',
                          cursor: isSelected ? 'pointer' : 'default',
                        }}
                      >
                        {n.label}
                      </button>
                    )
                  })}
                </div>
              </button>
            )
          })}
        </div>

        {selectedSports.length > 0 && (
          <p className="text-xs text-gray-400">
            {selectedSports.length} sport{selectedSports.length !== 1 ? 'en' : ''} geselecteerd
          </p>
        )}
      </div>

      {/* Weekrooster */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-3">
        <div>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#111' }}>Beschikbaarheid</p>
          <p className="text-xs text-gray-400 mt-0.5">Selecteer wanneer je kunt sporten</p>
        </div>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full min-w-[320px]">
            <thead>
              <tr>
                <td className="w-14" />
                {DAYS.map(d => (
                  <th key={d} className="text-center text-xs font-bold text-gray-500 pb-2 px-0.5">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIMES.map(time => (
                <tr key={time}>
                  <td className="text-xs text-gray-400 font-semibold pr-2 py-1 whitespace-nowrap">{time}</td>
                  {DAYS.map(day => {
                    const active = isActive(day, time)
                    return (
                      <td key={day} className="px-0.5 py-1 text-center">
                        <button
                          onClick={() => toggleSlot(day, time)}
                          className="w-9 h-9 rounded-lg text-[11px] font-bold transition-all"
                          style={{
                            background: active ? '#E87722' : 'rgba(0,0,0,0.05)',
                            color: active ? 'white' : '#D1D5DB',
                            transform: active ? 'scale(1.05)' : 'scale(1)',
                          }}
                        >
                          {active ? '✓' : ''}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400">{beschikbaarheid.length} tijdslot{beschikbaarheid.length !== 1 ? 'en' : ''} geselecteerd</p>
      </div>

      {/* Opslaan */}
      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-4 font-black text-sm rounded-2xl transition-colors disabled:opacity-40"
        style={{ ...SYNE, background: '#E87722', color: 'white' }}
      >
        {isPending ? 'Opslaan...' : 'Opslaan'}
      </button>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
