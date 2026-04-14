import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileContent, { type ProfileData } from './_components/ProfileContent'
import ProfileLoader from './_components/ProfileLoader'

// Demo profielen voor IDs die nog niet in de DB staan
const DEMO_PROFILES: Record<string, ProfileData> = {
  '1': {
    id: '1', name: 'Tim van Berg', region: 'Amsterdam',
    bio: 'Hardloper en fietser. Op zoek naar iemand voor ochtendrondes in het Vondelpark. Ik train 4x per week en doe mee aan lokale races.',
    sports: [{ label: 'Hardlopen', level: 'Gevorderd' }, { label: 'Fietsen', level: 'Gemiddeld' }],
  },
  '2': {
    id: '2', name: 'Sarah Jansen', region: 'Utrecht',
    bio: 'Wielrenster op zoek naar trainingsmaatje voor lange tochten in het weekend.',
    sports: [{ label: 'Fietsen', level: 'Gevorderd' }, { label: 'Yoga', level: 'Beginner' }],
    openFollow: true,
  },
  '3': {
    id: '3', name: 'Marco de Wit', region: 'Rotterdam',
    bio: 'Powerlifter, 3x per week in de gym. Op zoek naar een spotterbuddy voor zware sessies.',
    sports: [{ label: 'Gym', level: 'Gevorderd' }, { label: 'Voetbal', level: 'Gemiddeld' }],
  },
  '4': {
    id: '4', name: 'Lisa Hoek', region: 'Amsterdam',
    bio: 'Yoga en meditatie. Elke zondagochtend park yoga, iedereen welkom.',
    sports: [{ label: 'Yoga', level: 'Gevorderd' }, { label: 'Hardlopen', level: 'Beginner' }],
  },
  '5': {
    id: '5', name: 'Kevin Smit', region: 'Den Haag',
    bio: 'Voetballer en recreatief tennisspeler. Op zoek naar iemand voor weekendmatches.',
    sports: [{ label: 'Voetbal', level: 'Gemiddeld' }, { label: 'Tennis', level: 'Beginner' }],
  },
  '6': {
    id: '6', name: 'Anna de Boer', region: 'Amsterdam',
    bio: 'Triatleet in opleiding. Zwem, fiets en ren. Op zoek naar trainingspartner voor alle drie.',
    sports: [{ label: 'Zwemmen', level: 'Gevorderd' }, { label: 'Hardlopen', level: 'Gemiddeld' }, { label: 'Fietsen', level: 'Gemiddeld' }],
  },
  '7': {
    id: '7', name: 'Daan Bakker', region: 'Haarlem',
    bio: 'Tennis op dinsdagavond en padelcompetitie. Op zoek naar een dubbelpartner.',
    sports: [{ label: 'Tennis', level: 'Gevorderd' }, { label: 'Padel', level: 'Gemiddeld' }],
  },
  '8': {
    id: '8', name: 'Emma Visser', region: 'Amstelveen',
    bio: 'Golfer en wandelaar. Gezelligheid staat voorop.',
    sports: [{ label: 'Golf', level: 'Gemiddeld' }, { label: 'Wandelen', level: 'Beginner' }],
  },
  '9': {
    id: '9', name: 'Jelle Peters', region: 'Utrecht',
    bio: 'Basketbal en gym. Op zoek naar iemand voor 1-op-1 in het weekend.',
    sports: [{ label: 'Basketbal', level: 'Gemiddeld' }, { label: 'Gym', level: 'Beginner' }],
  },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function NotFound() {
  return (
    <div className="max-w-2xl mx-auto py-20 text-center">
      <p className="text-gray-400 font-semibold">Profiel niet gevonden.</p>
      <Link href="/dashboard/find" className="mt-4 inline-block text-[#E87722] font-bold hover:underline">
        Terug naar zoeken
      </Link>
    </div>
  )
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id: profileId } = await params

  // Demo IDs — direct renderen zonder DB-queries
  if (!UUID_RE.test(profileId)) {
    const demoProfile = DEMO_PROFILES[profileId] ?? null
    if (!demoProfile) return <NotFound />
    return (
      <ProfileContent
        profile={demoProfile}
        followStatus="none"
        currentUserId={user.id}
        isOwnProfile={false}
      />
    )
  }

  // Eigen profiel — gebruik ProfileLoader (laadt ook stats, sports etc.)
  if (user.id === profileId) {
    return (
      <ProfileLoader
        profileId={profileId}
        currentUserId={user.id}
        isOwnProfile={true}
      />
    )
  }

  // Ander profiel — haal data op server-side met service role key (bypast RLS)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminClient = serviceKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase

  const { data: dbProfile } = await adminClient
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .maybeSingle()

  if (!dbProfile) return <NotFound />

  const levelLabel: Record<string, string> = {
    beginner: 'Beginner', intermediate: 'Gemiddeld', advanced: 'Gevorderd',
  }

  const [
    { data: userSports },
    { count: followersCount },
    { count: followingCount },
    { count: postsCount },
  ] = await Promise.all([
    adminClient.from('user_sports').select('sport_id, level, sports(name)').eq('user_id', profileId),
    adminClient.from('follow_requests').select('*', { count: 'exact', head: true })
      .eq('to_user_id', profileId).eq('status', 'accepted'),
    adminClient.from('follow_requests').select('*', { count: 'exact', head: true })
      .eq('from_user_id', profileId).eq('status', 'accepted'),
    adminClient.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profileId),
  ])

  // Follow status ophalen voor de huidige gebruiker
  const { data: myRequest } = await supabase
    .from('follow_requests')
    .select('status')
    .eq('from_user_id', user.id)
    .eq('to_user_id', profileId)
    .neq('status', 'declined')
    .maybeSingle()

  let followStatus: 'none' | 'pending' | 'pending_received' | 'accepted' = 'none'
  if (myRequest?.status === 'accepted') followStatus = 'accepted'
  else if (myRequest?.status === 'pending') followStatus = 'pending'

  const db = dbProfile as any
  const mappedSports = (userSports ?? []).map((s: any) => ({
    label: (Array.isArray(s.sports) ? s.sports[0]?.name : s.sports?.name) ?? 'Sport',
    level: levelLabel[s.level] ?? s.level,
  }))

  const profile: ProfileData = {
    id:              db.id,
    name:            db.full_name ?? db.username ?? 'Onbekend',
    username:        db.username ?? undefined,
    region:          db.region ?? '',
    bio:             db.bio ?? '',
    sports:          mappedSports,
    avatarUrl:       db.avatar_url ?? undefined,
    bannerUrl:       db.banner_url ?? undefined,
    beschikbaarheid: db.beschikbaarheid ?? [],
    createdAt:       db.created_at ?? undefined,
    stats: {
      volgers: followersCount ?? 0,
      volgend: followingCount ?? 0,
      posts:   postsCount    ?? 0,
      groepen: 0,
    },
  }

  return (
    <ProfileContent
      profile={profile}
      followStatus={followStatus}
      currentUserId={user.id}
      isOwnProfile={false}
    />
  )
}
