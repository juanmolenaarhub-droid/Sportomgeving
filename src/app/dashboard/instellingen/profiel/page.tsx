'use client'

import { useState, useEffect, useRef, useTransition, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Check, Lock } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'
import { updateProfile } from '@/app/actions/settings'
import { checkUsernameAvailability, setInitialUsername } from '@/app/actions/profile'
import { CheckCircle, XCircle, Loader2 as SpinIcon } from 'lucide-react'
import { sanitizeText, limitLength } from '@/lib/sanitize'
import { SportSelector } from '@/components/ui/SportSelector'
import { getSportById, getSportByLabel } from '@/lib/sports'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const NIVEAUS: { value: 'beginner' | 'intermediate' | 'advanced'; label: string }[] = [
  { value: 'beginner',     label: 'Beginner'  },
  { value: 'intermediate', label: 'Gemiddeld' },
  { value: 'advanced',     label: 'Gevorderd' },
]

type SportEntry = { sportId: string; niveau: 'beginner' | 'intermediate' | 'advanced' }
const BESCHIKBAARHEID = [
  { value: 'ma_ochtend', label: 'Ochtend', day: 'Ma' },
  { value: 'ma_middag',  label: 'Middag',  day: 'Ma' },
  { value: 'ma_avond',   label: 'Avond',   day: 'Ma' },
  { value: 'di_ochtend', label: 'Ochtend', day: 'Di' },
  { value: 'di_middag',  label: 'Middag',  day: 'Di' },
  { value: 'di_avond',   label: 'Avond',   day: 'Di' },
  { value: 'wo_ochtend', label: 'Ochtend', day: 'Wo' },
  { value: 'wo_middag',  label: 'Middag',  day: 'Wo' },
  { value: 'wo_avond',   label: 'Avond',   day: 'Wo' },
  { value: 'do_ochtend', label: 'Ochtend', day: 'Do' },
  { value: 'do_middag',  label: 'Middag',  day: 'Do' },
  { value: 'do_avond',   label: 'Avond',   day: 'Do' },
  { value: 'vr_ochtend', label: 'Ochtend', day: 'Vr' },
  { value: 'vr_middag',  label: 'Middag',  day: 'Vr' },
  { value: 'vr_avond',   label: 'Avond',   day: 'Vr' },
  { value: 'za_ochtend', label: 'Ochtend', day: 'Za' },
  { value: 'za_middag',  label: 'Middag',  day: 'Za' },
  { value: 'za_avond',   label: 'Avond',   day: 'Za' },
  { value: 'zo_ochtend', label: 'Ochtend', day: 'Zo' },
  { value: 'zo_middag',  label: 'Middag',  day: 'Zo' },
  { value: 'zo_avond',   label: 'Avond',   day: 'Zo' },
]
const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
const TIMES = ['Ochtend', 'Middag', 'Avond']

type ProfileData = {
  full_name: string
  username: string
  bio: string
  region: string
  website: string
  phone: string
  birth_date: string
  training_location: string
  avatar_url: string | null
  banner_url: string | null
  beschikbaarheid: string[]
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
      <Check className="w-4 h-4 text-green-400" /> {msg}
    </div>
  )
}

export default function ProfielInstellingenPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<ProfileData>({
    full_name: '', username: '', bio: '', region: '', website: '',
    phone: '', birth_date: '', training_location: '',
    avatar_url: null, banner_url: null, beschikbaarheid: [],
  })
  const [selectedSports, setSelectedSports] = useState<SportEntry[]>([])

  // ── Username banner state (shown when profile has no username yet) ──
  const [bannerUsername, setBannerUsername]       = useState('')
  const [bannerState, setBannerState]             = useState<'neutral' | 'checking' | 'available' | 'unavailable'>('neutral')
  const [bannerMsg, setBannerMsg]                 = useState('')
  const [bannerSaving, setBannerSaving]           = useState(false)
  const bannerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleBannerUsernameChange = useCallback((raw: string) => {
    const val = raw.toLowerCase().replace(/\s/g, '')
    setBannerUsername(val)
    setBannerMsg('')
    if (bannerDebounceRef.current) clearTimeout(bannerDebounceRef.current)
    if (!val || val.length < 3) { setBannerState('neutral'); return }
    setBannerState('checking')
    bannerDebounceRef.current = setTimeout(async () => {
      const result = await checkUsernameAvailability(val)
      if (result.available) {
        setBannerState('available')
        setBannerMsg('')
      } else {
        setBannerState('unavailable')
        const msgs: Record<string, string> = {
          taken: 'Al in gebruik.', invalid: 'Alleen letters, cijfers, _ en .', too_short: 'Min. 3 tekens.', too_long: 'Max. 30 tekens.', reserved: 'Gereserveerde naam.',
        }
        setBannerMsg(msgs[(result as { available: false; reason: string }).reason] ?? 'Niet beschikbaar.')
      }
    }, 600)
  }, [])

  async function handleSetUsername() {
    if (bannerState !== 'available') return
    setBannerSaving(true)
    const res = await setInitialUsername(bannerUsername)
    if (res.success) {
      setForm(prev => ({ ...prev, username: bannerUsername }))
      setToast('Gebruikersnaam ingesteld!')
    } else {
      setBannerMsg(res.error)
      setBannerState('unavailable')
    }
    setBannerSaving(false)
  }

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: prof }, { data: sp }] = await Promise.all([
        supabase.from('profiles')
          .select('full_name, username, bio, region, website, phone, birth_date, training_location, avatar_url, banner_url, beschikbaarheid')
          .eq('id', user.id).single(),
        supabase.from('user_sports').select('level, sports(name)').eq('user_id', user.id),
      ])

      if (prof) {
        setForm({
          full_name: prof.full_name ?? '',
          username: prof.username ?? '',
          bio: prof.bio ?? '',
          region: prof.region ?? '',
          website: (prof as Record<string, unknown>).website as string ?? '',
          phone: (prof as Record<string, unknown>).phone as string ?? '',
          birth_date: (prof as Record<string, unknown>).birth_date as string ?? '',
          training_location: (prof as Record<string, unknown>).training_location as string ?? '',
          avatar_url: prof.avatar_url ?? null,
          banner_url: prof.banner_url ?? null,
          beschikbaarheid: (prof.beschikbaarheid as string[]) ?? [],
        })
      }
      if (sp && sp.length > 0) {
        const entries: SportEntry[] = (sp as { level: string; sports: { name: string } | { name: string }[] | null }[])
          .map(s => {
            const name = Array.isArray(s.sports) ? s.sports[0]?.name : s.sports?.name
            if (!name) return null
            const found = getSportByLabel(name)
            return { sportId: found?.id ?? name.toLowerCase(), niveau: s.level as SportEntry['niveau'] }
          })
          .filter((e): e is SportEntry => e !== null)
        setSelectedSports(entries)
      }
      setLoading(false)
    }
    load()
  }, [])

  function set(field: keyof ProfileData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleBeschikbaarheid(val: string) {
    setForm(prev => ({
      ...prev,
      beschikbaarheid: prev.beschikbaarheid.includes(val)
        ? prev.beschikbaarheid.filter(v => v !== val)
        : [...prev.beschikbaarheid, val],
    }))
  }

  function handleSportsChange(ids: string | string[]) {
    const newIds = ids as string[]
    setSelectedSports(prev => {
      const kept  = prev.filter(e => newIds.includes(e.sportId))
      const added = newIds
        .filter(id => !prev.some(e => e.sportId === id))
        .map(id => ({ sportId: id, niveau: 'intermediate' as const }))
      return [...kept, ...added]
    })
  }

  function setNiveauForSport(sportId: string, niveau: SportEntry['niveau']) {
    setSelectedSports(prev => prev.map(e => e.sportId === sportId ? { ...e, niveau } : e))
  }

  async function saveSports(userId: string) {
    await supabase.from('user_sports').delete().eq('user_id', userId)
    const inserts = await Promise.all(
      selectedSports.map(async s => {
        const label = getSportById(s.sportId)?.label ?? s.sportId
        const { data } = await supabase.from('sports').select('id').eq('name', label).maybeSingle()
        return data ? { user_id: userId, sport_id: data.id, level: s.niveau, looking_for_partner: true } : null
      })
    )
    const valid = inserts.filter(Boolean)
    if (valid.length > 0) await supabase.from('user_sports').insert(valid)
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadingAvatar(false); return }
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      setForm(prev => ({ ...prev, avatar_url: `${publicUrl}?t=${Date.now()}` }))
      setToast('Profielfoto opgeslagen')
    }
    setUploadingAvatar(false)
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingBanner(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadingBanner(false); return }
    const ext = file.name.split('.').pop()
    const path = `banners/${user.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!upErr) {
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('profiles').update({ banner_url: publicUrl }).eq('id', user.id)
      setForm(prev => ({ ...prev, banner_url: `${publicUrl}?t=${Date.now()}` }))
      setToast('Banner opgeslagen')
    }
    setUploadingBanner(false)
  }

  function handleSubmit() {
    setError(null)
    if (!form.full_name.trim()) return setError('Naam is verplicht')

    startTransition(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const [res] = await Promise.all([
        updateProfile({
          full_name: sanitizeText(limitLength(form.full_name, 80)),
          username: form.username, // read-only, pass as-is
          bio: sanitizeText(limitLength(form.bio, 160)),
          region: sanitizeText(limitLength(form.region, 80)),
          website: form.website.trim(),
          phone: form.phone.trim(),
          birth_date: form.birth_date || undefined,
          training_location: sanitizeText(limitLength(form.training_location, 80)),
        }),
        user ? saveSports(user.id) : Promise.resolve(),
      ])
      if (res.success) {
        setToast('Profiel opgeslagen!')
      } else {
        setError(res.error ?? 'Er ging iets mis')
      }
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
          <p className="text-xs text-gray-400">Instellingen › Profiel</p>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#111' }}>Profiel bewerken</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      )}

      {/* Username setup banner — shown when no username is set yet */}
      {!form.username && (
        <div className="bg-[#E87722]/10 border border-[#E87722]/30 rounded-xl p-4 space-y-3">
          <div>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 13, color: '#E87722' }}>Kies je gebruikersnaam</p>
            <p className="text-xs text-gray-500 mt-0.5">Je gebruikersnaam is permanent. Kies hem zorgvuldig.</p>
          </div>

          {bannerUsername.length >= 3 && (
            <p className="text-[11px] text-gray-400">
              buddys.nl/@<span className="text-gray-700 font-semibold">{bannerUsername}</span>
            </p>
          )}

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
            <input
              value={bannerUsername}
              onChange={e => handleBannerUsernameChange(e.target.value)}
              placeholder="jouwusername"
              className="w-full pl-7 pr-9 py-2.5 bg-white border border-black/10 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#E87722] transition-colors"
              style={SYNE}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {bannerState === 'checking'    && <SpinIcon size={15} className="animate-spin text-gray-400" />}
              {bannerState === 'available'   && <CheckCircle size={15} className="text-green-500" />}
              {bannerState === 'unavailable' && <XCircle size={15} className="text-red-400" />}
            </span>
          </div>

          {bannerMsg && <p className="text-[11px] text-red-500">{bannerMsg}</p>}

          <button
            type="button"
            onClick={handleSetUsername}
            disabled={bannerState !== 'available' || bannerSaving}
            className="w-full py-2.5 rounded-lg text-white text-sm font-bold disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: '#E87722', ...SYNE }}
          >
            {bannerSaving ? 'Opslaan...' : 'Gebruikersnaam instellen'}
          </button>
        </div>
      )}

      {/* Banner */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="w-full h-32 relative flex items-center justify-center group"
          style={{ background: form.banner_url ? 'transparent' : '#F5F0E8' }}
        >
          {form.banner_url
            ? <img src={form.banner_url} alt="Banner" className="w-full h-full object-cover" />
            : <span className="text-xs text-gray-400 font-semibold">Klik om banner te uploaden</span>
          }
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
            {uploadingBanner && <div className="absolute w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          </div>
        </button>
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />

        {/* Avatar + naam */}
        <div className="px-5 pb-5 -mt-8">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="relative shrink-0 group"
          >
            <div className="ring-4 ring-white rounded-full inline-block">
              <Avatar name={form.full_name || 'G'} imageUrl={form.avatar_url} size="lg" />
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingAvatar
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Camera className="w-4 h-4 text-white" />
              }
            </div>
          </button>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <div className="mt-3">
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>{form.full_name || 'Jouw naam'}</p>
            <p className="text-xs text-gray-400">@{form.username || 'gebruikersnaam'}</p>
          </div>
        </div>
      </div>

      {/* Formulier */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#111' }}>Basisinfo</p>

        <Field label="Weergavenaam" required>
          <input value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Jouw naam" className={INPUT} />
        </Field>

        <Field label="Gebruikersnaam">
          <div className="flex items-center gap-2 bg-black/5 border border-black/10 rounded-lg px-3 py-2.5 cursor-not-allowed select-none">
            <span className="text-gray-400 text-sm">@</span>
            <span className="flex-1 text-sm text-black/50 font-medium">{form.username || '—'}</span>
            <Lock className="w-3.5 h-3.5 text-black/30 shrink-0" />
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Je gebruikersnaam is permanent en kan niet worden aangepast.</p>
        </Field>

        <Field label={`Bio (${form.bio.length}/160)`}>
          <textarea
            rows={3}
            value={form.bio}
            onChange={e => set('bio', e.target.value.slice(0, 160))}
            placeholder="Vertel iets over jezelf..."
            className={`${INPUT} resize-none`}
          />
        </Field>

        <Field label="Stad / regio">
          <input value={form.region} onChange={e => set('region', e.target.value)} placeholder="Bijv. Amsterdam" className={INPUT} />
        </Field>

        <Field label="Geboortedatum">
          <input type="date" value={form.birth_date} onChange={e => set('birth_date', e.target.value)} className={INPUT} />
        </Field>

        <Field label="Website">
          <input type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." className={INPUT} />
        </Field>

        <Field label="Trainingslocatie">
          <input value={form.training_location} onChange={e => set('training_location', e.target.value)} placeholder="Bijv. Vondelpark of Basic-Fit Noord" className={INPUT} />
        </Field>
      </div>

      {/* Sporten */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <div>
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#111' }}>Jouw sporten</p>
          <p className="text-xs text-gray-400 mt-0.5">Selecteer alle sporten die je beoefent.</p>
        </div>

        <SportSelector
          value={selectedSports.map(e => e.sportId)}
          onChange={handleSportsChange}
          multiple
          placeholder="Zoek of voeg een sport toe..."
        />

        {selectedSports.length > 0 && (
          <div className="space-y-3 pt-1">
            <p className="text-xs font-bold text-gray-500">Niveau per sport</p>
            {selectedSports.map(entry => {
              const sport = getSportById(entry.sportId)
              return (
                <div key={entry.sportId} className="flex items-center justify-between gap-4">
                  <span style={{ ...SYNE, fontWeight: 700, fontSize: 13, color: '#111' }}>
                    {sport?.label ?? entry.sportId}
                  </span>
                  <div className="flex gap-1.5">
                    {NIVEAUS.map(n => (
                      <button
                        key={n.value}
                        type="button"
                        onClick={() => setNiveauForSport(entry.sportId, n.value)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: entry.niveau === n.value ? '#E87722' : '#F3F4F6',
                          color: entry.niveau === n.value ? 'white' : '#6B7280',
                        }}
                      >
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Beschikbaarheid weekrooster */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-3">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#111' }}>Beschikbaarheid</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <td className="w-16" />
                {DAYS.map(d => (
                  <th key={d} className="text-center font-bold text-gray-500 pb-2 px-1">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIMES.map(time => (
                <tr key={time}>
                  <td className="text-xs text-gray-400 font-semibold pr-2 py-1">{time}</td>
                  {DAYS.map(day => {
                    const val = `${day.toLowerCase()}_${time.toLowerCase()}`
                    const active = form.beschikbaarheid.includes(val)
                    return (
                      <td key={day} className="px-1 py-1 text-center">
                        <button
                          onClick={() => toggleBeschikbaarheid(val)}
                          className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${
                            active
                              ? 'bg-[#E87722] text-white shadow-sm'
                              : 'bg-black/5 text-gray-400 hover:bg-black/10'
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
      </div>

      {/* Opslaan */}
      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full py-4 bg-[#111] text-white font-black text-sm rounded-2xl hover:bg-[#333] transition-colors disabled:opacity-40"
        style={SYNE}
      >
        {isPending ? 'Opslaan...' : 'Wijzigingen opslaan'}
      </button>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-600 mb-1.5">
        {label} {required && <span className="text-[#E87722]">*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT = 'w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722] bg-white'
