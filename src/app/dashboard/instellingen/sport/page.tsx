'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { updateSportSettings } from '@/app/actions/settings'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const SPORTS = [
  { name: 'Hardlopen', emoji: '🏃' }, { name: 'Fietsen', emoji: '🚴' },
  { name: 'Zwemmen', emoji: '🏊' },   { name: 'Gym', emoji: '🏋️' },
  { name: 'Voetbal', emoji: '⚽' },   { name: 'Tennis', emoji: '🎾' },
  { name: 'Padel', emoji: '🏓' },     { name: 'Yoga', emoji: '🧘' },
  { name: 'Boksen', emoji: '🥊' },    { name: 'Klimmen', emoji: '🧗' },
  { name: 'Triathlon', emoji: '🏅' }, { name: 'Overig', emoji: '⚡' },
]

const NIVEAUS = [
  { value: 'beginner',     label: 'Beginner',  desc: 'Ik ben net begonnen en leer de basis' },
  { value: 'intermediate', label: 'Gemiddeld', desc: 'Enige ervaring, train regelmatig' },
  { value: 'advanced',     label: 'Gevorderd', desc: 'Ervaren sporter, serieus bezig' },
]

const DAYS  = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const TIMES = ['Ochtend', 'Middag', 'Avond']

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
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [sport, setSport]   = useState('Hardlopen')
  const [niveau, setNiveau] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [beschikbaarheid, setBeschikbaarheid] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: prof }, { data: sp }] = await Promise.all([
        supabase.from('profiles').select('beschikbaarheid').eq('id', user.id).single(),
        supabase.from('user_sports').select('level, sports(name)').eq('user_id', user.id).limit(1).maybeSingle(),
      ])
      if (prof) setBeschikbaarheid((prof.beschikbaarheid as string[]) ?? [])
      if (sp) {
        const name = Array.isArray(sp.sports) ? (sp.sports[0] as { name: string })?.name : (sp.sports as { name: string } | null)?.name
        if (name) setSport(name)
        setNiveau(sp.level as 'beginner' | 'intermediate' | 'advanced')
      }
      setLoading(false)
    }
    load()
  }, [])

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
    startTransition(async () => {
      const res = await updateSportSettings({ sport, niveau, beschikbaarheid })
      if (res.success) setToast('Sport instellingen opgeslagen!')
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
      <div className="flex items-center gap-3">
        <Link href="/dashboard/instellingen" className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400">Instellingen › Sport</p>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#111' }}>Sport & beschikbaarheid</h1>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      {/* Sport kiezen */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-3">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#111' }}>Primaire sport</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {SPORTS.map(s => (
            <button
              key={s.name}
              onClick={() => setSport(s.name)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                sport === s.name
                  ? 'border-[#E87722] bg-orange-50'
                  : 'border-black/8 hover:border-black/16 bg-white'
              }`}
            >
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-xs font-bold text-gray-700">{s.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Niveau */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-3">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#111' }}>Niveau</p>
        <div className="space-y-2">
          {NIVEAUS.map(n => (
            <button
              key={n.value}
              onClick={() => setNiveau(n.value as 'beginner' | 'intermediate' | 'advanced')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                niveau === n.value
                  ? 'border-[#E87722] bg-orange-50'
                  : 'border-black/8 hover:border-black/16'
              }`}
            >
              <div className="flex-1">
                <p style={{ ...SYNE, fontWeight: 700, fontSize: 14, color: '#111' }}>{n.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
              </div>
              {niveau === n.value && <Check className="w-4 h-4 text-[#E87722] shrink-0" />}
            </button>
          ))}
        </div>
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
                          className={`w-9 h-9 rounded-lg text-[11px] font-bold transition-all ${
                            active
                              ? 'bg-[#E87722] text-white shadow-sm scale-105'
                              : 'bg-black/5 text-gray-300 hover:bg-black/10 hover:text-gray-500'
                          }`}
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

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-4 bg-[#111] text-white font-black text-sm rounded-2xl hover:bg-[#333] transition-colors disabled:opacity-40"
        style={SYNE}
      >
        {isPending ? 'Opslaan...' : 'Opslaan'}
      </button>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
