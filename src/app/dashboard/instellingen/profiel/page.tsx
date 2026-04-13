'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Camera, Check } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { createClient } from '@/lib/supabase'
import { updateProfile } from '@/app/actions/settings'
import { sanitizeText, limitLength } from '@/lib/sanitize'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const SPORTS = [
  'Hardlopen', 'Triathlon', 'Fietsen', 'Zwemmen', 'Voetbal',
  'Tennis', 'Padel', 'Gym', 'Basketbal', 'Yoga', 'Boksen', 'Klimmen', 'Overig',
]
const NIVEAUS = [
  { value: 'beginner',     label: 'Beginner',  desc: 'Ik ben net begonnen' },
  { value: 'intermediate', label: 'Gemiddeld', desc: 'Enige ervaring' },
  { value: 'advanced',     label: 'Gevorderd', desc: 'Regelmatig actief' },
]
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

type SportRow = {
  sport_id: number
  level: string
  sports: { name: string } | { name: string }[] | null
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
  const [sport, setSport]   = useState('Hardlopen')
  const [niveau, setNiveau] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')

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
        supabase.from('user_sports').select('sport_id, level, sports(name)').eq('user_id', user.id).limit(1).maybeSingle(),
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
      if (sp) {
        const spRow = sp as SportRow
        const name = Array.isArray(spRow.sports) ? (spRow.sports[0] as { name: string })?.name : (spRow.sports as { name: string } | null)?.name
        if (name) setSport(name)
        setNiveau((spRow.level as 'beginner' | 'intermediate' | 'advanced') ?? 'beginner')
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
    if (!form.username.trim()) return setError('Gebruikersnaam is verplicht')

    startTransition(async () => {
      const res = await updateProfile({
        full_name: sanitizeText(limitLength(form.full_name, 80)),
        username: sanitizeText(limitLength(form.username, 40)),
        bio: sanitizeText(limitLength(form.bio, 160)),
        region: sanitizeText(limitLength(form.region, 80)),
        website: form.website.trim(),
        phone: form.phone.trim(),
        birth_date: form.birth_date || undefined,
        training_location: sanitizeText(limitLength(form.training_location, 80)),
      })
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

        {/* Avatar */}
        <div className="px-5 pb-5 flex items-end gap-4 -mt-8">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="relative shrink-0 group"
          >
            <div className="ring-4 ring-white rounded-full">
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
          <div className="pb-1">
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

        <Field label="Gebruikersnaam" required>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
            <input value={form.username} onChange={e => set('username', e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())} placeholder="gebruikersnaam" className={`${INPUT} pl-7`} />
          </div>
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
