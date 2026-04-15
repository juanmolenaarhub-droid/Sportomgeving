'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Shield, Globe, Lock } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'
import { updatePrivacySettings, unblockUser } from '@/app/actions/settings'
import type { PrivacySettingsInput } from '@/app/actions/settings'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type BlockedUser = {
  blocked_id: string
  name: string
  avatarUrl: string | null
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
      <Check className="w-4 h-4 text-green-400" /> {msg}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-[#E87722]' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  )
}

export default function PrivacyInstellingenPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [unblocking, setUnblocking] = useState<string | null>(null)

  const [settings, setSettings] = useState<PrivacySettingsInput>({
    show_city: true,
    show_age: true,
    is_searchable: true,
    show_in_find: true,
    show_online_status: true,
    account_type: 'open',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('profiles')
        .select('show_city, show_age, is_searchable, show_in_find, show_online_status, account_type')
        .eq('id', user.id)
        .single()

      if (prof) {
        const p = prof as Record<string, unknown>
        setSettings({
          show_city:          p.show_city          as boolean ?? true,
          show_age:           p.show_age           as boolean ?? true,
          is_searchable:      p.is_searchable      as boolean ?? true,
          show_in_find:       p.show_in_find       as boolean ?? true,
          show_online_status: p.show_online_status as boolean ?? true,
          account_type:       (p.account_type as 'open' | 'private') ?? 'open',
        })
      }

      // Laad geblokkeerde users
      const { data: blocked } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id)

      if (blocked && blocked.length > 0) {
        const ids = blocked.map(b => b.blocked_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .in('id', ids)

        setBlockedUsers((profiles ?? []).map(p => ({
          blocked_id: p.id,
          name: p.full_name ?? p.username ?? 'Onbekend',
          avatarUrl: p.avatar_url ?? null,
        })))
      }

      setLoading(false)
    }
    load()
  }, [])

  function toggle(key: keyof PrivacySettingsInput) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await updatePrivacySettings(settings)
      if (res.success) setToast('Privacy instellingen opgeslagen')
      else setError(res.error ?? 'Er ging iets mis')
    })
  }

  async function handleUnblock(blockedId: string) {
    setUnblocking(blockedId)
    const res = await unblockUser(blockedId)
    if (res.success) {
      setBlockedUsers(prev => prev.filter(u => u.blocked_id !== blockedId))
      setToast('Gebruiker gedeblokkeerd')
    }
    setUnblocking(null)
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto py-12 flex justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#E87722] rounded-full animate-spin" />
    </div>
  )

  const TOGGLES = [
    { key: 'is_searchable'      as const, label: 'Profiel zichtbaarheid',        desc: 'Anderen kunnen je profiel vinden via zoeken' },
    { key: 'show_in_find'       as const, label: 'Verschijn in Zoek Buddies',    desc: 'Jouw kaart verschijnt in de zoek-buddies pagina' },
    { key: 'show_city'          as const, label: 'Stad tonen',                   desc: 'Jouw stad is zichtbaar op je profiel' },
    { key: 'show_age'           as const, label: 'Leeftijd tonen',               desc: 'Jouw leeftijd is zichtbaar op je profiel' },
    { key: 'show_online_status' as const, label: 'Online status',                desc: 'Anderen zien wanneer je online bent' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/instellingen" className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400">Instellingen › Privacy</p>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#111' }}>Privacy</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      )}

      {/* Toggle kaart */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-5 py-3 border-b border-black/5 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#E87722]" />
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 13, color: '#111' }}>Zichtbaarheid</p>
        </div>
        <div className="divide-y divide-black/5">
          {TOGGLES.map(({ key, label, desc }) => (
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

      {/* Account type */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-5 py-3 border-b border-black/5 flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#E87722]" />
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 13, color: '#111' }}>Accounttype</p>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-400">
            Kies of je posts zichtbaar zijn voor iedereen op het platform, of alleen voor je buddies.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'open' as const, icon: Globe, label: 'Openbaar', desc: 'Posts zichtbaar in Ontdekken' },
              { value: 'private' as const, icon: Lock, label: 'Privé', desc: 'Posts alleen voor buddies' },
            ].map(({ value, icon: Icon, label, desc }) => {
              const active = settings.account_type === value
              return (
                <button
                  key={value}
                  onClick={() => setSettings(prev => ({ ...prev, account_type: value }))}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center"
                  style={{ borderColor: active ? '#E87722' : '#E5E7EB', background: active ? '#FFF5EE' : 'white' }}
                >
                  <Icon className="w-5 h-5" style={{ color: active ? '#E87722' : '#9CA3AF' }} />
                  <div>
                    <p className="text-sm font-black" style={{ ...SYNE, color: active ? '#E87722' : '#111' }}>{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  {active && <span className="w-2 h-2 rounded-full bg-[#E87722]" />}
                </button>
              )
            })}
          </div>
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

      {/* Geblokkeerde gebruikers */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-5 py-3 border-b border-black/5">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 13, color: '#111' }}>Geblokkeerde gebruikers</p>
        </div>
        {blockedUsers.length === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">Je hebt niemand geblokkeerd.</p>
        ) : (
          <div className="divide-y divide-black/5">
            {blockedUsers.map(u => (
              <div key={u.blocked_id} className="flex items-center gap-3 px-5 py-4">
                <Avatar name={u.name} imageUrl={u.avatarUrl} size="sm" />
                <p className="flex-1 text-sm font-semibold text-gray-800">{u.name}</p>
                <button
                  onClick={() => handleUnblock(u.blocked_id)}
                  disabled={unblocking === u.blocked_id}
                  className="text-xs font-bold text-[#E87722] border border-[#E87722]/30 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
                >
                  {unblocking === u.blocked_id ? '...' : 'Deblokkeren'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}
