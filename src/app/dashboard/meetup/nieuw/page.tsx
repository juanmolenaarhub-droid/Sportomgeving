'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Zap, Calendar, MapPin, ChevronDown, Users, Globe, Lock, Check, ImagePlus, X } from 'lucide-react'
import { createMeetup } from '@/app/actions/meetups'
import { createClient } from '@/lib/supabase'

const SPORTS = ['Hardlopen', 'Fietsen', 'Gym', 'Yoga', 'Zwemmen', 'Voetbal', 'Padel', 'Tennis', 'Golf', 'Wandelen', 'Boksen', 'Klimmen']
const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

// Mini kaartje voor locatiepreview
const LocationPreviewMap = dynamic(() => import('../_components/LocationPreviewMap'), { ssr: false })

type GeoResult = { lat: number; lon: number; display_name: string; city: string }

async function geocode(query: string): Promise<GeoResult[]> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return []
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=nl&language=nl&limit=5&access_token=${token}`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.features ?? []).map((f: { center: [number, number]; place_name: string; context?: { id: string; text: string }[] }) => {
    const city = f.context?.find(c => c.id.startsWith('place.'))?.text
      ?? f.context?.find(c => c.id.startsWith('locality.'))?.text
      ?? ''
    return { lat: f.center[1], lon: f.center[0], display_name: f.place_name, city }
  })
}

export default function NewMeetupPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Stap 1: modus
  const [mode, setMode] = useState<'spontaan' | 'gepland' | null>(null)

  // Stap 2: details
  const [sport, setSport] = useState('Hardlopen')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [locationResults, setLocationResults] = useState<GeoResult[]>([])
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number; name: string; city: string } | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [maxParticipants, setMaxParticipants] = useState(8)
  const [visibility, setVisibility] = useState<'publiek' | 'alleen_buddies'>('publiek')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Locatie zoeken met debounce
  useEffect(() => {
    if (locationQuery.length < 3) { setLocationResults([]); return }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const results = await geocode(locationQuery)
      setLocationResults(results)
      setSearching(false)
    }, 500)
  }, [locationQuery])

  // Min. datum voor gepland (vandaag)
  const todayStr = new Date().toISOString().split('T')[0]
  const maxDateStr = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

  const titlePlaceholders: Record<string, string> = {
    'Hardlopen': 'Ochtendrun Vondelpark',
    'Fietsen': 'Zondagsrit door de polder',
    'Gym': 'Wie gaat er mee naar de gym?',
    'Yoga': 'Yoga sessie in het park',
    default: 'Beschrijf jouw meetup...',
  }

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  function removeCover() {
    setCoverFile(null)
    setCoverPreview(null)
    if (coverInputRef.current) coverInputRef.current.value = ''
  }

  function handleSelectLocation(r: GeoResult) {
    const nameParts = r.display_name.split(',')
    const shortName = nameParts.slice(0, 2).join(',').trim()
    setSelectedLocation({ lat: r.lat, lon: r.lon, name: shortName, city: r.city })
    setLocationQuery(shortName)
    setLocationResults([])
  }

  function handleSubmit() {
    if (!mode) return setError('Kies een modus')
    if (!title.trim()) return setError('Titel is verplicht')
    if (!selectedLocation) return setError('Kies een locatie')
    if (mode === 'gepland' && (!date || !time)) return setError('Datum en tijd zijn verplicht')

    startTransition(async () => {
      let coverImageUrl: string | undefined

      if (coverFile) {
        setCoverUploading(true)
        try {
          const supabase = createClient()
          const ext = coverFile.name.split('.').pop()
          const path = `${Date.now()}.${ext}`
          const { data: up, error: upErr } = await supabase.storage
            .from('meetup-covers')
            .upload(path, coverFile, { contentType: coverFile.type, upsert: false })
          if (!upErr && up) {
            const { data: { publicUrl } } = supabase.storage.from('meetup-covers').getPublicUrl(up.path)
            coverImageUrl = publicUrl
          }
        } finally {
          setCoverUploading(false)
        }
      }

      const res = await createMeetup({
        sport,
        title: title.trim(),
        description: description.trim() || undefined,
        locationName: selectedLocation.name,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lon,
        city: selectedLocation.city,
        isSpontaneous: mode === 'spontaan',
        date: mode === 'gepland' ? date : undefined,
        time: mode === 'gepland' ? time : undefined,
        maxParticipants,
        visibility,
        coverImageUrl,
      })
      if (res.success) {
        router.push('/dashboard/meetup')
      } else {
        setError(res.error ?? 'Er ging iets mis')
      }
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 22, color: '#111' }}>Meetup aanmaken</h1>
          <p className="text-sm text-gray-400">Zoek een trainingsmaatje bij jou in de buurt</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      {/* Stap 1: Modus */}
      <div className="bg-white rounded-2xl border border-black/8 p-5">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#111', marginBottom: 12 }}>
          Stap 1 — Kies een modus
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('spontaan')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              mode === 'spontaan'
                ? 'border-[#E87722] bg-orange-50'
                : 'border-black/8 hover:border-black/16 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className={`w-5 h-5 ${mode === 'spontaan' ? 'text-[#E87722]' : 'text-gray-400'}`} />
              <span style={{ ...SYNE, fontWeight: 800, fontSize: 15, color: '#111' }}>Spontaan</span>
              {mode === 'spontaan' && <Check className="w-4 h-4 text-[#E87722] ml-auto" />}
            </div>
            <p className="text-xs text-gray-500">Ik ga nú sporten</p>
            <p className="text-xs text-gray-400 mt-1">Verloopt na 3 uur</p>
          </button>

          <button
            onClick={() => setMode('gepland')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              mode === 'gepland'
                ? 'border-[#111] bg-gray-50'
                : 'border-black/8 hover:border-black/16 bg-white'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className={`w-5 h-5 ${mode === 'gepland' ? 'text-[#111]' : 'text-gray-400'}`} />
              <span style={{ ...SYNE, fontWeight: 800, fontSize: 15, color: '#111' }}>Gepland</span>
              {mode === 'gepland' && <Check className="w-4 h-4 text-[#111] ml-auto" />}
            </div>
            <p className="text-xs text-gray-500">Plan voor later</p>
            <p className="text-xs text-gray-400 mt-1">Max 14 dagen vooruit</p>
          </button>
        </div>
      </div>

      {/* Stap 2: Details */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#111' }}>Stap 2 — Details</p>

        {/* Sport */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Sport <span className="text-[#E87722]">*</span></label>
          <div className="relative">
            <select
              value={sport}
              onChange={e => setSport(e.target.value)}
              className="w-full appearance-none border border-black/10 rounded-xl pl-4 pr-8 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#E87722] bg-white"
            >
              {SPORTS.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Titel */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Titel <span className="text-[#E87722]">*</span></label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value.slice(0, 60))}
            placeholder={titlePlaceholders[sport] ?? titlePlaceholders.default}
            className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{title.length}/60</p>
        </div>

        {/* Beschrijving */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Beschrijving <span className="text-gray-400">(optioneel)</span></label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 300))}
            placeholder="Vertel iets over jouw niveau, tempo of wat je zoekt in een trainingsmaatje"
            className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E87722]"
          />
          <p className="text-right text-xs text-gray-400 mt-1">{description.length}/300</p>
        </div>

        {/* Cover foto */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">
            Cover foto <span className="text-gray-400">(optioneel)</span>
          </label>
          {coverPreview ? (
            <div className="relative rounded-xl overflow-hidden" style={{ height: 140 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removeCover}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="w-full border-2 border-dashed border-black/12 rounded-xl py-7 flex flex-col items-center gap-2 hover:border-[#E87722] hover:bg-orange-50 transition-all text-gray-400 hover:text-[#E87722]"
            >
              <ImagePlus className="w-6 h-6" />
              <span className="text-xs font-semibold">Klik om een foto te uploaden</span>
              <span className="text-xs">JPG, PNG — max 5MB</span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleCoverSelect}
          />
        </div>

        {/* Locatie */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">Locatie <span className="text-[#E87722]">*</span></label>
          <div className="relative">
            <input
              type="text"
              value={locationQuery}
              onChange={e => { setLocationQuery(e.target.value); setSelectedLocation(null) }}
              placeholder="Bijv. Vondelpark Amsterdam"
              className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]"
            />
            {searching && <div className="absolute right-3 top-3 w-4 h-4 border-2 border-[#E87722] border-t-transparent rounded-full animate-spin" />}
          </div>

          {locationResults.length > 0 && (
            <div className="mt-1 bg-white border border-black/10 rounded-xl overflow-hidden shadow-lg z-10 relative">
              {locationResults.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectLocation(r)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-50 border-b border-black/5 last:border-0 flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#E87722] mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {selectedLocation && (
            <div className="mt-3 rounded-xl overflow-hidden border border-black/8" style={{ height: 180 }}>
              <LocationPreviewMap lat={selectedLocation.lat} lon={selectedLocation.lon} />
            </div>
          )}
        </div>

        {/* Datum + tijd (alleen gepland) */}
        {mode === 'gepland' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Datum <span className="text-[#E87722]">*</span></label>
              <input
                type="date"
                min={todayStr}
                max={maxDateStr}
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Tijd <span className="text-[#E87722]">*</span></label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full border border-black/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E87722]"
              />
            </div>
          </div>
        )}

        {/* Max deelnemers */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5">
            Max deelnemers: <span className="text-[#E87722]">{maxParticipants}</span>
          </label>
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min={2}
              max={20}
              value={maxParticipants}
              onChange={e => setMaxParticipants(Number(e.target.value))}
              className="flex-1 accent-[#E87722]"
            />
            <span className="text-sm font-bold text-gray-600 w-6 text-center">{maxParticipants}</span>
          </div>
        </div>

        {/* Zichtbaarheid */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">Zichtbaarheid</label>
          <div className="space-y-2">
            {([
              { value: 'publiek', icon: Globe, label: 'Publiek', sub: 'Zichtbaar voor alle sporters bij jou in de buurt' },
              { value: 'alleen_buddies', icon: Lock, label: 'Alleen buddies', sub: 'Alleen zichtbaar voor jouw buddies' },
            ] as const).map(({ value, icon: Icon, label, sub }) => (
              <button
                key={value}
                onClick={() => setVisibility(value)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  visibility === value ? 'border-[#E87722] bg-orange-50' : 'border-black/8 hover:border-black/16'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${visibility === value ? 'text-[#E87722]' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{sub}</p>
                </div>
                {visibility === value && <Check className="w-4 h-4 text-[#E87722] shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || !mode || !title.trim() || !selectedLocation}
        className="w-full py-4 bg-[#E87722] text-white font-black text-base rounded-2xl hover:bg-[#d4691d] transition-colors disabled:opacity-40"
        style={SYNE}
      >
        {coverUploading ? 'Foto uploaden...' : isPending ? 'Aanmaken...' : '🚀 Meetup aanmaken'}
      </button>
    </div>
  )
}
