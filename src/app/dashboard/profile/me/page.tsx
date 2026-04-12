'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { MapPin, Award, Settings, UserPlus, MessageCircle, Bell, Camera, X, Check, Lightbulb, ThumbsUp, Bug, Zap, Calendar } from 'lucide-react'
import { ProfileHeader } from '@/components/ProfileHeader'
import { createClient } from '@/lib/supabase'
import { sanitizeText, limitLength } from '@/lib/sanitize'
import { validateImageFile } from '@/lib/validateFile'

const BESCHIKBAARHEID_META: Record<string, { emoji: string; label: string; sub: string }> = {
  ochtend: { emoji: '☀️', label: 'Ochtend', sub: '06–12' },
  middag:  { emoji: '🌤', label: 'Middag',  sub: '12–17' },
  avond:   { emoji: '🌙', label: 'Avond',   sub: '17–22' },
  weekend: { emoji: '📅', label: 'Weekend', sub: 'Za & Zo' },
}

type Profile = {
  id: string
  full_name: string | null
  username: string | null
  region: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  age: number | null
  gender: string | null
  goal: string | null
  beschikbaarheid: string[] | null
}

type UserSport = {
  sport_id: number
  level: string
  sports: { name: string } | { name: string }[] | null
}

const levelLabel: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Gemiddeld',
  advanced: 'Gevorderd',
}

const ALL_SPORTS = [
  { id: 1, name: 'Hardlopen' }, { id: 2, name: 'Fietsen' }, { id: 3, name: 'Zwemmen' },
  { id: 4, name: 'Gym' }, { id: 5, name: 'Voetbal' }, { id: 6, name: 'Tennis' },
  { id: 7, name: 'Golf' }, { id: 8, name: 'Yoga' }, { id: 9, name: 'Padel' },
  { id: 10, name: 'Triathlon' }, { id: 11, name: 'Boksen' }, { id: 12, name: 'Klimmen' },
]

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Gevorderd' },
  { value: 'advanced', label: 'Professioneel' },
]

function MyMeetupsCard({ userId }: { userId: string }) {
  const [meetups, setMeetups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: created }, { data: participating }] = await Promise.all([
        supabase.from('meetups').select('id, sport, title, date, time, is_spontaneous, status, city').eq('creator_id', userId).order('created_at', { ascending: false }).limit(5),
        supabase.from('meetup_participants').select('meetup_id').eq('user_id', userId).eq('status', 'geaccepteerd'),
      ])
      const partIds = (participating ?? []).map((p: any) => p.meetup_id)
      let partMeetups: any[] = []
      if (partIds.length > 0) {
        const { data } = await supabase.from('meetups').select('id, sport, title, date, time, is_spontaneous, status, city').in('id', partIds).order('created_at', { ascending: false }).limit(5)
        partMeetups = (data ?? []).filter((m: any) => !(created ?? []).find((c: any) => c.id === m.id))
      }
      setMeetups([...(created ?? []).map((m: any) => ({ ...m, role: 'organizer' })), ...partMeetups.map((m: any) => ({ ...m, role: 'participant' }))])
      setLoading(false)
    }
    load()
  }, [userId])

  const SPORT_COLORS: Record<string, string> = { 'Hardlopen': '#E87722', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4', 'Gym': '#22C55E', default: '#6B7280' }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-black">Mijn Meetups</h3>
        <Link href="/dashboard/meetup/nieuw" className="text-xs text-[#E87722] font-semibold hover:underline flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Aanmaken
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : meetups.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">Nog geen meetups.</p>
          <Link href="/dashboard/meetup" className="text-xs text-[#E87722] font-semibold hover:underline mt-1 block">Ontdek meetups</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {meetups.slice(0, 4).map((m: any) => {
            const color = SPORT_COLORS[m.sport] ?? SPORT_COLORS.default
            return (
              <Link key={m.id} href={`/dashboard/meetup/${m.id}`} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-2 h-8 rounded-full shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-black truncate">{m.title}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    {m.is_spontaneous ? <><Zap className="w-3 h-3 text-red-400" /> Spontaan</> : m.date ? <><Calendar className="w-3 h-3" /> {new Date(`${m.date}T${m.time ?? '00:00'}`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}</> : m.city}
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.status === 'open' ? 'bg-green-50 text-green-600' : m.status === 'vol' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>{m.status}</span>
              </Link>
            )
          })}
          <Link href="/dashboard/meetup" className="block text-center text-xs text-[#E87722] font-semibold hover:underline pt-1">Alle meetups bekijken</Link>
        </div>
      )}
    </div>
  )
}

function ProfileFeedbackWidget() {
  const [selected, setSelected] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  if (sent) return (
    <div className="flex flex-col items-center py-4 gap-2 text-center">
      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
        <ThumbsUp className="w-5 h-5 text-green-600" />
      </div>
      <p className="text-sm font-bold text-black">Bedankt!</p>
      <p className="text-xs text-gray-400">We nemen je feedback mee.</p>
    </div>
  )
  const options = [
    { key: 'idea', label: 'Idee delen', icon: Lightbulb, color: 'text-yellow-500 bg-yellow-50' },
    { key: 'good', label: 'Werkt goed', icon: ThumbsUp, color: 'text-green-600 bg-green-50' },
    { key: 'bug', label: 'Bug melden', icon: Bug, color: 'text-red-500 bg-red-50' },
  ]
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => setSelected(selected === key ? null : key)}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all text-center ${selected === key ? 'border-[#111] bg-black/5' : 'border-gray-100 hover:border-gray-200'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-3.5 h-3.5" /></div>
            <span className="text-[10px] font-bold text-gray-600 leading-tight">{label}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="space-y-2">
          <textarea rows={3} placeholder="Schrijf hier je feedback..."
            className="w-full text-xs text-gray-700 placeholder-gray-300 border border-gray-100 rounded-xl p-3 resize-none focus:outline-none focus:border-[#111] transition-colors" />
          <button onClick={() => setSent(true)}
            className="w-full py-2 bg-[#111111] text-white text-xs font-bold rounded-xl hover:bg-[#333] transition-colors">
            Versturen
          </button>
        </div>
      )}
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ profile, sports, onClose, onSaved }: {
  profile: Profile
  sports: UserSport[]
  onClose: () => void
  onSaved: (p: Profile, sp: UserSport[]) => void
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [region, setRegion] = useState(profile.region ?? '')
  const [age, setAge] = useState(profile.age?.toString() ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [gender, setGender] = useState(profile.gender ?? '')
  const [goal, setGoal] = useState(profile.goal ?? 'geen')
  const [beschikbaarheid, setBeschikbaarheid] = useState<string[]>(profile.beschikbaarheid ?? [])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url ?? '')
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState(profile.banner_url ?? '')
  const [selectedSports, setSelectedSports] = useState<{ sport_id: number; level: string }[]>(
    sports.map(s => ({ sport_id: s.sport_id, level: s.level }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); return }
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  function toggleSport(id: number) {
    setSelectedSports(prev => {
      const exists = prev.find(s => s.sport_id === id)
      if (exists) return prev.filter(s => s.sport_id !== id)
      return [...prev, { sport_id: id, level: 'beginner' }]
    })
  }

  function setLevelForSport(id: number, level: string) {
    setSelectedSports(prev => prev.map(s => s.sport_id === id ? { ...s, level } : s))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let avatarUrl = profile.avatar_url
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()
        const path = `avatars/${user.id}.${ext}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
        if (uploadError) throw new Error(`Foto upload: ${uploadError.message}`)
        avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      }

      let bannerUrl = profile.banner_url
      if (bannerFile) {
        const ext = bannerFile.name.split('.').pop()
        const path = `banners/${user.id}.${ext}`
        const { error: uploadError } = await supabase.storage.from('avatars').upload(path, bannerFile, { upsert: true })
        if (uploadError) throw new Error(`Banner upload: ${uploadError.message}`)
        bannerUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
      }

      const { error: profileError } = await supabase.from('profiles').update({
        full_name:  sanitizeText(limitLength(fullName, 80)),
        region:     sanitizeText(limitLength(region, 80)),
        age:        age ? parseInt(age) : null,
        bio:        sanitizeText(limitLength(bio, 500)),
        gender:          gender || null,
        goal:            goal || null,
        beschikbaarheid: beschikbaarheid.length > 0 ? beschikbaarheid : [],
        avatar_url:      avatarUrl,
        banner_url:      bannerUrl,
      }).eq('id', user.id)

      if (profileError) throw new Error(profileError.message)

      // Sporten opslaan
      await supabase.from('user_sports').delete().eq('user_id', user.id)
      if (selectedSports.length > 0) {
        await supabase.from('user_sports').insert(
          selectedSports.map(s => ({ user_id: user.id, sport_id: s.sport_id, level: s.level, looking_for_partner: true }))
        )
      }

      // Geef bijgewerkt profiel terug
      const updatedProfile: Profile = {
        ...profile,
        full_name: sanitizeText(limitLength(fullName, 80)),
        region: sanitizeText(limitLength(region, 80)),
        age: age ? parseInt(age) : null,
        bio: sanitizeText(limitLength(bio, 500)),
        gender: gender || null,
        goal:            goal || null,
        beschikbaarheid: beschikbaarheid.length > 0 ? beschikbaarheid : [],
        avatar_url:      avatarUrl,
        banner_url:      bannerUrl,
      }

      // Haal bijgewerkte sporten op
      const { data: sp } = await supabase.from('user_sports').select('sport_id, level, sports(name)').eq('user_id', user.id)
      onSaved(updatedProfile, (sp ?? []) as UserSport[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Opslaan mislukt')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <p className="font-black text-black text-lg">Profiel bewerken</p>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Banner + Avatar */}
          <div className="relative" style={{ paddingBottom: 44 }}>
            <button type="button" onClick={() => bannerRef.current?.click()}
              className="group block w-full rounded-xl overflow-hidden"
              style={{ height: 100, background: bannerPreview ? 'transparent' : '#F0EFED', border: bannerPreview ? 'none' : '2px dashed #D5D3CF', position: 'relative' }}>
              {bannerPreview
                ? <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
                : <div className="flex flex-col items-center justify-center h-full gap-1"><Camera className="w-5 h-5 text-gray-400" /><span className="text-xs text-gray-400 font-medium">Bannerafbeelding</span></div>
              }
              <div className="group-hover:opacity-100 opacity-0 absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity rounded-xl">
                <span className="text-xs font-bold text-white">Wijzigen</span>
              </div>
            </button>
            <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />

            <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
              <button type="button" onClick={() => avatarRef.current?.click()} className="group relative block">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white bg-gray-100 flex items-center justify-center shadow">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                    : <Camera className="w-6 h-6 text-gray-400" />
                  }
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#E87722] rounded-full border-2 border-white flex items-center justify-center">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>

          {/* Naam */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Volledige naam</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jan de Vries"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
          </div>

          {/* Regio + Leeftijd */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Stad / Regio</label>
              <input value={region} onChange={e => setRegion(e.target.value)} placeholder="Amsterdam"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Leeftijd</label>
              <input value={age} onChange={e => setAge(e.target.value)} type="number" min={16} max={99} placeholder="25"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
            </div>
          </div>

          {/* Geslacht */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Geslacht</label>
            <div className="flex gap-2">
              {['Man', 'Vrouw', 'Anders'].map(g => (
                <button key={g} onClick={() => setGender(g)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: gender === g ? '#E87722' : '#EDEDED', color: gender === g ? 'white' : '#555', border: 'none', cursor: 'pointer' }}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Over mij</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Ik sport graag 3x per week..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722] resize-none" />
          </div>

          {/* Partnervoorkeur */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Zoekt sportbuddy</label>
            <div className="flex gap-2">
              {['Man', 'Vrouw', 'geen'].map(g => (
                <button key={g} onClick={() => setGoal(g)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: goal === g ? '#111111' : '#EDEDED', color: goal === g ? 'white' : '#555', border: 'none', cursor: 'pointer' }}>
                  {g === 'geen' ? 'Geen voorkeur' : g}
                </button>
              ))}
            </div>
          </div>

          {/* Beschikbaarheid */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">Beschikbaarheid</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BESCHIKBAARHEID_META).map(([value, meta]) => {
                const selected = beschikbaarheid.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBeschikbaarheid(prev =>
                      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
                    )}
                    className="relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
                    style={{
                      border: `1.5px solid ${selected ? '#E87722' : '#E5E5E5'}`,
                      background: selected ? '#FFF5EE' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{meta.emoji}</span>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: selected ? '#E87722' : '#111' }}>{meta.label}</p>
                      <p style={{ fontSize: 10, color: '#aaa' }}>{meta.sub}</p>
                    </div>
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#E87722] rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sporten */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">Sporten</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {ALL_SPORTS.map(sport => {
                const sel = selectedSports.some(s => s.sport_id === sport.id)
                return (
                  <button key={sport.id} onClick={() => toggleSport(sport.id)}
                    className="relative py-3 px-2 rounded-xl text-xs font-semibold transition-all text-center"
                    style={{ border: `1.5px solid ${sel ? '#E87722' : '#E5E5E5'}`, background: sel ? '#FFF5EE' : 'white', color: sel ? '#E87722' : '#333', cursor: 'pointer' }}>
                    {sel && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#E87722] rounded-full flex items-center justify-center"><Check className="w-2 h-2 text-white" strokeWidth={3} /></span>}
                    {sport.name}
                  </button>
                )
              })}
            </div>
            {selectedSports.length > 0 && (
              <div className="space-y-2">
                {selectedSports.map(s => {
                  const name = ALL_SPORTS.find(sp => sp.id === s.sport_id)?.name ?? ''
                  return (
                    <div key={s.sport_id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-bold text-[#E87722] mb-2">{name}</p>
                      <div className="flex gap-2">
                        {LEVELS.map(l => (
                          <button key={l.value} onClick={() => setLevelForSport(s.sport_id, l.value)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: s.level === l.value ? '#E87722' : '#EDEDED', color: s.level === l.value ? 'white' : '#555', border: 'none', cursor: 'pointer' }}>
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
        </div>

        <div className="px-5 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Annuleren</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3 rounded-xl bg-[#111111] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#333] disabled:opacity-50 transition-colors">
            {saving ? 'Opslaan...' : <><Check className="w-4 h-4" /> Opslaan</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Hoofdpagina ───────────────────────────────────────────────────────────────
export default function MyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sports, setSports] = useState<UserSport[]>([])
  const [stats, setStats] = useState({ volgers: 0, volgend: 0, posts: 0, groepen: 0 })
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [
        { data: prof },
        { data: sp },
        { count: volgers },
        { count: volgend },
        { count: posts },
        { count: groepen },
      ] = await Promise.all([
        supabase.from('profiles').select('id, full_name, username, region, bio, avatar_url, banner_url, age, gender, goal, beschikbaarheid').eq('id', user.id).single(),
        supabase.from('user_sports').select('sport_id, level, sports(name)').eq('user_id', user.id),
        supabase.from('follow_requests').select('*', { count: 'exact', head: true }).eq('to_user_id', user.id).eq('status', 'accepted'),
        supabase.from('follow_requests').select('*', { count: 'exact', head: true }).eq('from_user_id', user.id).eq('status', 'accepted'),
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ])

      if (prof) setProfile(prof as Profile)
      if (sp) setSports(sp as UserSport[])
      setStats({ volgers: volgers ?? 0, volgend: volgend ?? 0, posts: posts ?? 0, groepen: groepen ?? 0 })
      setLoading(false)
    }
    load()
  }, [])

  const displayName = profile?.full_name || profile?.username || 'Jouw naam'

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Profiel header kaart */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <ProfileHeader
          key={`${profile?.avatar_url}-${profile?.banner_url}`}
          name={displayName}
          avatarUrl={profile?.avatar_url ?? undefined}
          bannerUrl={profile?.banner_url ?? undefined}
          editable={false}
          size="md"
        />
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-2 mt-1">
                  <div className="h-6 bg-gray-100 rounded w-40 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded w-28 animate-pulse" />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-black text-black">{displayName}</h1>
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-sm text-gray-400 mt-1">
                    {profile?.region && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{profile.region}</span>}
                    {profile?.age && <span>{profile.age} jaar</span>}
                    {profile?.gender && <span>{profile.gender}</span>}
                  </div>
                  {profile?.goal && profile.goal !== 'geen' && (
                    <p className="text-xs text-gray-400 mt-1">Zoekt: <span className="font-semibold text-gray-600">{profile.goal}</span></p>
                  )}
                  {profile?.bio && (
                    <p className="text-sm text-gray-600 mt-3 max-w-lg leading-relaxed">{profile.bio}</p>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shrink-0"
            >
              <Settings className="w-4 h-4" /> Bewerken
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-6 pt-6 border-t border-gray-50">
            {[
              { label: 'Volgers', value: stats.volgers },
              { label: 'Volgend', value: stats.volgend },
              { label: 'Posts', value: stats.posts },
              { label: 'Groepen', value: stats.groepen },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-black">{s.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Sporten */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-black">Sporten</h3>
            <button onClick={() => setShowEdit(true)} className="text-xs text-[#E87722] font-semibold hover:underline">Bewerken</button>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : sports.length > 0 ? (
            <div className="space-y-2.5">
              {sports.map(s => {
                const name = (Array.isArray(s.sports) ? s.sports[0]?.name : s.sports?.name) ?? 'Sport'
                const lbl = levelLabel[s.level] ?? s.level
                return (
                  <div key={s.sport_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-[#E87722]" />
                      <span className="text-sm font-semibold text-gray-700">{name}</span>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${lbl === 'Gevorderd' ? 'bg-black text-white' : lbl === 'Gemiddeld' ? 'bg-[#E87722] text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {lbl}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Nog geen sporten.{' '}
              <button onClick={() => setShowEdit(true)} className="text-[#E87722] font-semibold hover:underline">Voeg toe</button>
            </p>
          )}
        </div>

        {/* Beschikbaarheid */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-black">Beschikbaarheid</h3>
            <button onClick={() => setShowEdit(true)} className="text-xs text-[#E87722] font-semibold hover:underline">Bewerken</button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-2">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : profile?.beschikbaarheid && profile.beschikbaarheid.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {profile.beschikbaarheid.map(slot => {
                const meta = BESCHIKBAARHEID_META[slot]
                if (!meta) return null
                return (
                  <div key={slot} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl" style={{ background: '#FFF5EE', border: '1.5px solid #FDDCBD' }}>
                    <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-[#E87722]">{meta.label}</p>
                      <p className="text-[10px] text-orange-300">{meta.sub}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              Nog geen beschikbaarheid.{' '}
              <button onClick={() => setShowEdit(true)} className="text-[#E87722] font-semibold hover:underline">Voeg toe</button>
            </p>
          )}
        </div>

        {/* Rechter kolom */}
        <div className="md:col-span-2 space-y-4">

          {/* Zoek een buddy */}
          <Link href="/dashboard/find" className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#E87722] hover:shadow-sm transition-all group">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[#E87722]" />
            </div>
            <div>
              <p className="font-black text-black group-hover:text-[#E87722] transition-colors">Zoek een buddy</p>
              <p className="text-xs text-gray-400 mt-0.5">Vind sporters op jouw niveau in jouw buurt</p>
            </div>
          </Link>

          {/* Activiteit */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-black mb-4">Activiteit</h3>
            <div className="space-y-1.5">
              <Link href="/dashboard/messages" className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-2.5 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Berichten</span>
                </div>
              </Link>
              <Link href="/dashboard/notifications" className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-2.5 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                    <Bell className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">Notificaties</span>
                </div>
              </Link>
            </div>
          </div>

          {/* Groepen */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-black">Mijn groepen</h3>
              <Link href="/dashboard/groups" className="text-xs text-[#E87722] font-semibold hover:underline">Alle groepen</Link>
            </div>
            <p className="text-sm text-gray-400">Nog geen groepen.</p>
          </div>

          {/* Meetups */}
          {profile?.id && <MyMeetupsCard userId={profile.id} />}

          {/* Feedback */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-black text-black">Feedback & ideeën</h3>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Nieuw</span>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">Help ons Buddys beter te maken.</p>
            <ProfileFeedbackWidget />
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && profile && (
        <EditModal
          profile={profile}
          sports={sports}
          onClose={() => setShowEdit(false)}
          onSaved={(updatedProfile, updatedSports) => {
            setProfile(updatedProfile)
            setSports(updatedSports)
            setShowEdit(false)
          }}
        />
      )}
    </div>
  )
}
