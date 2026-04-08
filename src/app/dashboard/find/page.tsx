'use client'

import { useState } from 'react'
import { Search, MapPin, Filter, X, UserPlus, Check, MessageCircle, ChevronDown } from 'lucide-react'
import { StoryAvatar, type StoryPost } from '@/components/StoryAvatar'
import { ProfileHeader } from '@/components/ProfileHeader'

const SPORTS = [
  { value: 'all', label: 'Alle sporten' },
  { value: 'run', label: 'Hardlopen' },
  { value: 'cycle', label: 'Fietsen' },
  { value: 'swim', label: 'Zwemmen' },
  { value: 'gym', label: 'Gym' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'football', label: 'Voetbal' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'hiking', label: 'Wandelen' },
  { value: 'padel', label: 'Padel' },
  { value: 'golf', label: 'Golf' },
  { value: 'basketball', label: 'Basketbal' },
  { value: 'volleyball', label: 'Volleybal' },
]

const LEVELS = ['Alle niveaus', 'Beginner', 'Gemiddeld', 'Gevorderd']

type Buddy = {
  id: string
  name: string
  region: string
  age: number
  bio: string
  sports: { label: string; level: string }[]
  following: boolean
  requested: boolean
  post?: StoryPost
  bannerUrl?: string
  avatarUrl?: string
}

const ALL_BUDDIES: Buddy[] = [
  {
    id: '1', name: 'Tim van Berg', region: 'Amsterdam', age: 28,
    bio: 'Hardloper en fietser. Op zoek naar iemand voor ochtendrondes in het Vondelpark.',
    sports: [{ label: 'Hardlopen', level: 'Gevorderd' }, { label: 'Fietsen', level: 'Gemiddeld' }],
    following: false, requested: false,
    post: { id: 'p1', user: { name: 'Tim van Berg', avatar: 'TV', region: 'Amsterdam' }, content: 'Geweldige ochtendrun door het Vondelpark. 10km in 52 minuten.', activity_type: 'run', activity_icon: '', activity_label: 'Hardlopen', distance_km: 10.4, duration_minutes: 52, image_url: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80', likes_count: 24, comments_count: 5, created_at: '2 min geleden' },
  },
  {
    id: '2', name: 'Sarah Jansen', region: 'Utrecht', age: 25,
    bio: 'Wielrenster op zoek naar trainingsmaatje voor lange tochten in het weekend.',
    sports: [{ label: 'Fietsen', level: 'Gevorderd' }, { label: 'Yoga', level: 'Beginner' }],
    following: true, requested: false,
    post: { id: 'p2', user: { name: 'Sarah Jansen', avatar: 'SJ', region: 'Utrecht' }, content: '45km gefietst langs de Vecht. Prachtig weer en geweldig uitzicht.', activity_type: 'cycle', activity_icon: '', activity_label: 'Fietsen', distance_km: 45, duration_minutes: 105, image_url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&q=80', likes_count: 41, comments_count: 8, created_at: '1 uur geleden' },
  },
  {
    id: '3', name: 'Marco de Wit', region: 'Rotterdam', age: 32,
    bio: 'Powerlifter, 3x per week in de gym. Op zoek naar een spotterbuddy voor zware sessies.',
    sports: [{ label: 'Gym', level: 'Gevorderd' }, { label: 'Voetbal', level: 'Gemiddeld' }],
    following: false, requested: true,
  },
  {
    id: '4', name: 'Lisa Hoek', region: 'Amsterdam', age: 30,
    bio: 'Yoga en meditatie. Elke zondagochtend park yoga, iedereen welkom.',
    sports: [{ label: 'Yoga', level: 'Gevorderd' }, { label: 'Hardlopen', level: 'Beginner' }],
    following: false, requested: false,
    post: { id: 'p4', user: { name: 'Lisa Hoek', avatar: 'LH', region: 'Amsterdam' }, content: 'Zondagochtend yoga in het park. Wie wil volgende week ook komen? We starten om 8:00.', activity_type: 'yoga', activity_icon: '', activity_label: 'Yoga', image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80', likes_count: 89, comments_count: 21, created_at: 'Gisteren' },
  },
  {
    id: '5', name: 'Kevin Smit', region: 'Den Haag', age: 22,
    bio: 'Voetballer en recreatief tennisspeler. Op zoek naar iemand voor weekendmatches.',
    sports: [{ label: 'Voetbal', level: 'Gemiddeld' }, { label: 'Tennis', level: 'Beginner' }],
    following: false, requested: false,
  },
  {
    id: '6', name: 'Anna de Boer', region: 'Amsterdam', age: 27,
    bio: 'Triatleet in opleiding. Zwem, fiets en ren. Op zoek naar trainingspartner voor alle drie.',
    sports: [{ label: 'Zwemmen', level: 'Gevorderd' }, { label: 'Hardlopen', level: 'Gemiddeld' }, { label: 'Fietsen', level: 'Gemiddeld' }],
    following: false, requested: false,
  },
  {
    id: '7', name: 'Daan Bakker', region: 'Haarlem', age: 35,
    bio: 'Tennis op dinsdagavond en padelcompetitie. Op zoek naar een dubbelpartner.',
    sports: [{ label: 'Tennis', level: 'Gevorderd' }, { label: 'Padel', level: 'Gemiddeld' }],
    following: false, requested: false,
  },
  {
    id: '8', name: 'Emma Visser', region: 'Amstelveen', age: 29,
    bio: 'Golfer en wandelaar. Gezelligheid staat voorop.',
    sports: [{ label: 'Golf', level: 'Gemiddeld' }, { label: 'Wandelen', level: 'Beginner' }],
    following: false, requested: false,
  },
  {
    id: '9', name: 'Jelle Peters', region: 'Utrecht', age: 24,
    bio: 'Basketbal en gym. Op zoek naar iemand voor 1-op-1 in het weekend.',
    sports: [{ label: 'Basketbal', level: 'Gemiddeld' }, { label: 'Gym', level: 'Beginner' }],
    following: false, requested: false,
  },
]

function getLevelStyle(level: string) {
  if (level === 'Gevorderd') return 'bg-black text-white'
  if (level === 'Gemiddeld') return 'bg-[#E87722] text-white'
  return 'bg-gray-100 text-gray-500'
}

function ProfileModal({ buddy, onClose, onFollow }: { buddy: Buddy; onClose: () => void; onFollow: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Sluiten knop */}
        <div className="absolute top-4 right-4 z-10">
          <button onClick={onClose} className="w-8 h-8 bg-black/30 rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Banner + profielfoto (alleen bekijken, niet bewerken) */}
        <ProfileHeader
          name={buddy.name}
          bannerUrl={buddy.bannerUrl}
          avatarUrl={buddy.avatarUrl}
          editable={false}
          size="sm"
        />

        {/* Story avatar overlay op profielfoto (voor de oranje gloed) */}
        <div className="absolute left-5 top-[82px] z-10">
          <StoryAvatar name={buddy.name} size="lg" posts={buddy.post ? [buddy.post] : []} />
        </div>

        {/* Acties */}
        <div className="px-5 pb-2 flex items-center justify-end gap-2 -mt-3">
          <button className="w-10 h-10 border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors">
            <MessageCircle className="w-4 h-4 text-gray-500" />
          </button>
          <button
            onClick={onFollow}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
              buddy.following ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' :
              buddy.requested ? 'bg-gray-100 text-gray-500' :
              'bg-[#E87722] text-white hover:bg-[#d06a1a]'
            }`}
          >
            {buddy.following ? <><Check className="w-4 h-4" /> Volgend</> :
             buddy.requested ? 'Verzonden' :
             <><UserPlus className="w-4 h-4" /> Volgen</>}
          </button>
        </div>

        {/* Profielinfo */}
        <div className="px-5 pb-6 pt-2">
          <h2 className="text-xl font-black text-black">{buddy.name}</h2>
          <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-1 mb-3">
            <MapPin className="w-3.5 h-3.5" />{buddy.region}
            <span className="text-gray-200">·</span>
            <span>{buddy.age} jaar</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">{buddy.bio}</p>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Sporten</p>
            <div className="flex flex-wrap gap-2">
              {buddy.sports.map(sport => (
                <div key={sport.label} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm font-semibold text-gray-700">{sport.label}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getLevelStyle(sport.level)}`}>{sport.level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FindPage() {
  const [buddies, setBuddies] = useState<Buddy[]>(ALL_BUDDIES)
  const [search, setSearch] = useState('')
  const [selectedSport, setSelectedSport] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('Alle niveaus')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null)

  function toggleFollow(id: string) {
    setBuddies(prev => prev.map(b =>
      b.id === id ? { ...b, following: b.following ? false : b.requested ? b.following : b.following, requested: b.following ? b.requested : b.requested ? false : true } : b
    ))
    setSelectedBuddy(prev => {
      if (!prev || prev.id !== id) return prev
      const b = prev
      return { ...b, following: b.following ? false : b.requested ? b.following : b.following, requested: b.following ? b.requested : b.requested ? false : true }
    })
  }

  const filtered = buddies.filter(b => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.region.toLowerCase().includes(search.toLowerCase())
    const matchSport = selectedSport === 'all' || b.sports.some(s => s.label.toLowerCase() === (SPORTS.find(sp => sp.value === selectedSport)?.label.toLowerCase() ?? ''))
    const matchLevel = selectedLevel === 'Alle niveaus' || b.sports.some(s => s.level === selectedLevel)
    const matchRegion = !selectedRegion || b.region.toLowerCase().includes(selectedRegion.toLowerCase())
    return matchSearch && matchSport && matchLevel && matchRegion
  })

  const suggested = filtered.filter(b => !b.following)
  const following = filtered.filter(b => b.following)

  return (
    <div className="space-y-6">
      {/* Zoekbalk */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Zoek op naam of stad..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${showFilters ? 'bg-[#E87722] text-white border-[#E87722]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Sport</label>
            <div className="flex flex-wrap gap-2">
              {SPORTS.map(sport => (
                <button
                  key={sport.value}
                  onClick={() => setSelectedSport(sport.value)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all ${selectedSport === sport.value ? 'border-[#E87722] bg-orange-50 text-[#E87722]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                >
                  {sport.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Niveau</label>
              <div className="relative">
                <select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722] pr-8">
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Stad / Regio</label>
              <input type="text" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} placeholder="bv. Amsterdam" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#E87722]" />
            </div>
          </div>
          {(selectedSport !== 'all' || selectedLevel !== 'Alle niveaus' || selectedRegion) && (
            <button onClick={() => { setSelectedSport('all'); setSelectedLevel('Alle niveaus'); setSelectedRegion('') }} className="text-sm text-[#E87722] font-semibold hover:underline">Filters wissen</button>
          )}
        </div>
      )}

      {/* Sport snelfilter */}
      {!showFilters && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SPORTS.map(sport => (
            <button key={sport.value} onClick={() => setSelectedSport(sport.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-all shrink-0 ${selectedSport === sport.value ? 'bg-[#E87722] text-white border-[#E87722]' : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'}`}>
              {sport.label}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-400 font-medium"><span className="text-black font-bold">{filtered.length}</span> sporters gevonden</p>

      {following.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-black mb-4">Al volgend</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {following.map(buddy => <BuddyCard key={buddy.id} buddy={buddy} onOpen={() => setSelectedBuddy(buddy)} onFollow={() => toggleFollow(buddy.id)} />)}
          </div>
        </section>
      )}

      {suggested.length > 0 && (
        <section>
          <h2 className="text-lg font-black text-black mb-4">{following.length > 0 ? 'Ontdek meer buddies' : 'Aanbevolen voor jou'}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {suggested.map(buddy => <BuddyCard key={buddy.id} buddy={buddy} onOpen={() => setSelectedBuddy(buddy)} onFollow={() => toggleFollow(buddy.id)} />)}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Search className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <h3 className="font-black text-black mb-2">Geen sporters gevonden</h3>
          <p className="text-gray-400 text-sm">Pas je filters aan om meer resultaten te zien.</p>
        </div>
      )}

      {selectedBuddy && (
        <ProfileModal buddy={selectedBuddy} onClose={() => setSelectedBuddy(null)} onFollow={() => toggleFollow(selectedBuddy.id)} />
      )}
    </div>
  )
}

function BuddyCard({ buddy, onOpen, onFollow }: { buddy: Buddy; onOpen: () => void; onFollow: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group">
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <button onClick={onOpen}>
            <StoryAvatar name={buddy.name} size="lg" posts={buddy.post ? [buddy.post] : []} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onFollow() }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              buddy.following ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' :
              buddy.requested ? 'bg-gray-100 text-gray-400' :
              'bg-[#E87722] text-white hover:bg-[#d06a1a]'
            }`}
          >
            {buddy.following ? <><Check className="w-3 h-3" /> Volgend</> :
             buddy.requested ? 'Verzonden' :
             <><UserPlus className="w-3 h-3" /> Volgen</>}
          </button>
        </div>
        <button onClick={onOpen} className="text-left w-full">
          <h3 className="font-black text-black text-sm group-hover:text-[#E87722] transition-colors">{buddy.name}</h3>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{buddy.region} · {buddy.age} jaar</p>
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 leading-relaxed">{buddy.bio}</p>
        </button>
      </div>
      <div className="px-4 pb-4 flex flex-wrap gap-1.5">
        {buddy.sports.slice(0, 2).map(sport => (
          <span key={sport.label} className="flex items-center gap-1.5 text-xs font-semibold bg-gray-50 px-2.5 py-1 rounded-full text-gray-600">
            {sport.label}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${getLevelStyle(sport.level)}`}>{sport.level}</span>
          </span>
        ))}
        {buddy.sports.length > 2 && <span className="text-xs text-gray-400 font-medium px-2 py-1">+{buddy.sports.length - 2}</span>}
      </div>
    </div>
  )
}
