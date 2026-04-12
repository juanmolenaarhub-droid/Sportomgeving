import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ProfileContent, { type FollowStatus, type ProfileData, type MeetupStats } from './_components/ProfileContent'

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
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profileId = params.id

  // Haal echte follow_request status op (beide richtingen)
  const [{ data: myRequest }, { data: theirRequest }] = await Promise.all([
    supabase
      .from('follow_requests')
      .select('status')
      .eq('from_user_id', user.id)
      .eq('to_user_id', profileId)
      .neq('status', 'declined')
      .maybeSingle(),
    supabase
      .from('follow_requests')
      .select('status')
      .eq('from_user_id', profileId)
      .eq('to_user_id', user.id)
      .neq('status', 'declined')
      .maybeSingle(),
  ])

  let followStatus: FollowStatus = 'none'
  if (myRequest?.status === 'accepted' || theirRequest?.status === 'accepted') {
    followStatus = 'accepted'
  } else if (myRequest?.status === 'pending') {
    followStatus = 'pending'
  } else if (theirRequest?.status === 'pending') {
    followStatus = 'pending_received'
  }

  // Profiel + sporten + stats parallel laden
  const [
    { data: dbProfile },
    { data: userSports },
    { count: followersCount },
    { count: followingCount },
    { count: postsCount },
    { count: groupsCount },
  ] = await Promise.all([
    supabase.from('profiles')
      .select('id, full_name, username, bio, avatar_url, banner_url, region, beschikbaarheid, meetups_hosted, meetups_joined, meetups_attended, organizer_rating, organizer_review_count, created_at')
      .eq('id', profileId)
      .maybeSingle(),
    supabase.from('user_sports')
      .select('sport_id, level, sports(name)')
      .eq('user_id', profileId),
    // volgers = mensen die een geaccepteerd verzoek naar dit profiel hebben gestuurd
    supabase.from('follow_requests')
      .select('*', { count: 'exact', head: true })
      .eq('to_user_id', profileId)
      .eq('status', 'accepted'),
    // volgend = geaccepteerde verzoeken vanuit dit profiel
    supabase.from('follow_requests')
      .select('*', { count: 'exact', head: true })
      .eq('from_user_id', profileId)
      .eq('status', 'accepted'),
    supabase.from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profileId),
    supabase.from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profileId),
  ])

  const levelLabel: Record<string, string> = { beginner: 'Beginner', intermediate: 'Gemiddeld', advanced: 'Gevorderd' }
  const mappedSports = (userSports ?? []).map(s => ({
    label: (Array.isArray(s.sports) ? (s.sports[0] as any)?.name : (s.sports as any)?.name) ?? 'Sport',
    level: levelLabel[s.level] ?? s.level,
  }))

  let profile: ProfileData | null = null

  if (dbProfile) {
    const db = dbProfile as any
    const meetupStats: MeetupStats | undefined =
      db.meetups_hosted != null
        ? {
            meetupsHosted:        db.meetups_hosted ?? 0,
            meetupsJoined:        db.meetups_joined ?? 0,
            meetupsAttended:      db.meetups_attended ?? 0,
            organizerRating:      db.organizer_rating ?? null,
            organizerReviewCount: db.organizer_review_count ?? 0,
            createdAt:            db.created_at ?? new Date().toISOString(),
          }
        : undefined

    profile = {
      id: dbProfile.id,
      name: dbProfile.full_name ?? dbProfile.username ?? 'Onbekend',
      region: db.region ?? '',
      bio: dbProfile.bio ?? '',
      sports:          mappedSports,
      avatarUrl:       dbProfile.avatar_url ?? undefined,
      bannerUrl:       dbProfile.banner_url ?? undefined,
      beschikbaarheid: db.beschikbaarheid ?? [],
      stats: {
        volgers:  followersCount ?? 0,
        volgend:  followingCount ?? 0,
        posts:    postsCount ?? 0,
        groepen:  groupsCount ?? 0,
      },
      meetupStats,
    }
  } else if (DEMO_PROFILES[profileId]) {
    profile = DEMO_PROFILES[profileId]
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-gray-400 font-semibold">Profiel niet gevonden.</p>
        <Link href="/dashboard/find" className="mt-4 inline-block text-[#E87722] font-bold hover:underline">
          Terug naar zoeken
        </Link>
      </div>
    )
  }

  return (
    <ProfileContent
      profile={profile}
      followStatus={followStatus}
      currentUserId={user.id}
    />
  )
}
