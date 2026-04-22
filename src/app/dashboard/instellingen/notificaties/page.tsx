'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, Mail, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { updateNotificationSettings } from '@/app/actions/settings'
import type { NotificationSettingsInput } from '@/app/actions/settings'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-[#C4F542]' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
      <Check className="w-4 h-4 text-green-400" /> {msg}
    </div>
  )
}

const DEFAULT_SETTINGS: NotificationSettingsInput = {
  notify_buddy_request: true,
  notify_match: true,
  notify_message: true,
  notify_like: true,
  notify_comment: true,
  email_weekly: false,
  email_buddy_request: false,
  email_news: false,
}

export default function NotificatiesInstellingenPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<NotificationSettingsInput>(DEFAULT_SETTINGS)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('user_settings')
        .select('key, value')
        .eq('user_id', user.id)

      const map: Record<string, boolean> = {}
      for (const row of data ?? []) map[row.key] = row.value === 'true'

      setSettings({
        notify_buddy_request: map['notify_buddy_request'] ?? true,
        notify_match:         map['notify_match']         ?? true,
        notify_message:       map['notify_message']       ?? true,
        notify_like:          map['notify_like']          ?? true,
        notify_comment:       map['notify_comment']       ?? true,
        email_weekly:         map['email_weekly']         ?? false,
        email_buddy_request:  map['email_buddy_request']  ?? false,
        email_news:           map['email_news']           ?? false,
      })
      setLoading(false)
    }
    load()
  }, [])

  function toggle(key: keyof NotificationSettingsInput) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await updateNotificationSettings(settings)
      if (res.success) setToast('Notificatie-instellingen opgeslagen')
      else setError(res.error ?? 'Er ging iets mis')
    })
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto py-12 flex justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#C4F542] rounded-full animate-spin" />
    </div>
  )

  const IN_APP = [
    { key: 'notify_buddy_request' as const, label: 'Buddy-verzoek ontvangen',  desc: 'Melding als iemand een buddy-verzoek stuurt' },
    { key: 'notify_match'         as const, label: 'Match geaccepteerd',        desc: 'Melding als jouw verzoek geaccepteerd wordt' },
    { key: 'notify_message'       as const, label: 'Nieuw bericht',             desc: 'Melding bij elk nieuw chatbericht' },
    { key: 'notify_like'          as const, label: 'Like op je post',           desc: 'Melding als iemand je post liket' },
    { key: 'notify_comment'       as const, label: 'Reactie op je post',        desc: 'Melding bij een nieuwe reactie' },
  ]
  const EMAIL = [
    { key: 'email_weekly'        as const, label: 'Wekelijks overzicht',        desc: 'Samenvatting van je activiteit per week' },
    { key: 'email_buddy_request' as const, label: 'Buddy-verzoek via e-mail',   desc: 'E-mail bij een nieuw buddy-verzoek' },
    { key: 'email_news'          as const, label: 'Nieuws en updates',          desc: 'Productnieuws en aankondigingen' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/instellingen" className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400">Instellingen › Notificaties</p>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#1E2B20' }}>Notificaties</h1>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

      {/* In-app */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-5 py-3 border-b border-black/5 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#C4F542]" />
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 13, color: '#1E2B20' }}>In-app meldingen</p>
        </div>
        <div className="divide-y divide-black/5">
          {IN_APP.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <Toggle checked={settings[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </div>

      {/* E-mail */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-5 py-3 border-b border-black/5 flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 13, color: '#1E2B20' }}>E-mail meldingen</p>
          <span className="text-xs text-gray-300 ml-auto">Binnenkort beschikbaar</span>
        </div>
        <div className="divide-y divide-black/5 opacity-60 pointer-events-none">
          {EMAIL.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between px-5 py-4 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <Toggle checked={settings[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </div>
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
