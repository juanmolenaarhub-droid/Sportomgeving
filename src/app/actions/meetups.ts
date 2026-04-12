'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreateMeetupParams = {
  sport: string
  title: string
  description?: string
  locationName: string
  locationAddress?: string
  latitude: number
  longitude: number
  city: string
  isSpontaneous: boolean
  date?: string       // ISO date string (YYYY-MM-DD), alleen gepland
  time?: string       // HH:MM, alleen gepland
  maxParticipants?: number
  visibility?: 'publiek' | 'alleen_buddies'
  coverImageUrl?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function logActivity(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  eventType: string,
  metadata: Record<string, unknown>,
) {
  await supabase.from('activity_log').insert({ user_id: userId, event_type: eventType, metadata })
}

async function sendNotification(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  toUserId: string,
  type: string,
  message: string,
  link: string,
) {
  // Gebruik system_notifications als die tabel bestaat, anders sla notificatie over
  try {
    await supabase.from('system_notifications').insert({
      user_id: toUserId,
      type,
      message,
      link,
    })
  } catch {
    // Tabel bestaat mogelijk niet — log maar door
  }
}

// ─── 1. Meetup aanmaken ───────────────────────────────────────────────────────

export async function createMeetup(params: CreateMeetupParams) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const now = new Date()

  // Spontaan: expires_at = now + 3 uur
  let expiresAt: string | null = null
  if (params.isSpontaneous) {
    const exp = new Date(now.getTime() + 3 * 60 * 60 * 1000)
    expiresAt = exp.toISOString()
  } else {
    // Gepland: valideer datum
    if (!params.date || !params.time) return { success: false, error: 'Datum en tijd zijn verplicht voor geplande meetups' }
    const meetupDate = new Date(`${params.date}T${params.time}:00`)
    if (meetupDate <= now) return { success: false, error: 'Datum moet in de toekomst liggen' }
    const maxDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    if (meetupDate > maxDate) return { success: false, error: 'Datum mag maximaal 14 dagen vooruit zijn' }
  }

  const { data: meetup, error } = await supabase.from('meetups').insert({
    creator_id: user.id,
    sport: params.sport,
    title: params.title,
    description: params.description ?? null,
    location_name: params.locationName,
    location_address: params.locationAddress ?? null,
    latitude: params.latitude,
    longitude: params.longitude,
    city: params.city,
    is_spontaneous: params.isSpontaneous,
    date: params.date ?? null,
    time: params.time ?? null,
    expires_at: expiresAt,
    max_participants: params.maxParticipants ?? 10,
    visibility: params.visibility ?? 'publiek',
    status: 'open',
    cover_image_url: params.coverImageUrl ?? null,
  }).select().single()

  if (error || !meetup) return { success: false, error: error?.message ?? 'Aanmaken mislukt' }

  // Log activiteit
  await logActivity(supabase, user.id, 'meetup_created', {
    meetup_id: meetup.id,
    sport: params.sport,
    city: params.city,
    title: params.title,
  })

  // Stuur notificatie naar alle buddies
  const { data: buddyRequests } = await supabase
    .from('follow_requests')
    .select('from_user_id, to_user_id')
    .eq('status', 'accepted')
    .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)

  const profile = await supabase.from('profiles').select('full_name, username').eq('id', user.id).single()
  const senderName = profile.data?.full_name ?? profile.data?.username ?? 'Iemand'

  const buddyIds = (buddyRequests ?? []).map(r =>
    r.from_user_id === user.id ? r.to_user_id : r.from_user_id
  )

  for (const buddyId of buddyIds) {
    await sendNotification(
      supabase, buddyId, 'meetup_new_nearby',
      `${senderName} heeft een Meetup aangemaakt voor ${params.sport} in ${params.city}`,
      `/dashboard/meetup/${meetup.id}`,
    )
  }

  revalidatePath('/dashboard/meetup')
  return { success: true, meetupId: meetup.id }
}

// ─── 2. Interesse tonen ───────────────────────────────────────────────────────

export async function showInterest(meetupId: string, message?: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { data: meetup } = await supabase
    .from('meetups')
    .select('creator_id, title, status')
    .eq('id', meetupId)
    .single()

  if (!meetup) return { success: false, error: 'Meetup niet gevonden' }
  if (meetup.status !== 'open') return { success: false, error: 'Meetup is niet meer open' }
  if (meetup.creator_id === user.id) return { success: false, error: 'Je kunt geen interesse tonen in je eigen meetup' }

  const { error } = await supabase.from('meetup_participants').insert({
    meetup_id: meetupId,
    user_id: user.id,
    status: 'interesse',
    message: message ?? null,
  })

  if (error) return { success: false, error: 'Al interesse getoond' }

  const profile = await supabase.from('profiles').select('full_name, username').eq('id', user.id).single()
  const senderName = profile.data?.full_name ?? profile.data?.username ?? 'Iemand'

  await sendNotification(
    supabase, meetup.creator_id, 'meetup_interest',
    `${senderName} toont interesse in jouw Meetup '${meetup.title}'`,
    `/dashboard/meetup/${meetupId}`,
  )

  await logActivity(supabase, user.id, 'meetup_interest', { meetup_id: meetupId })

  revalidatePath(`/dashboard/meetup/${meetupId}`)
  return { success: true }
}

// ─── 3. Reageren op interesse (organisator) ────────────────────────────────────

export async function respondToInterest(
  meetupId: string,
  userId: string,
  response: 'geaccepteerd' | 'geweigerd',
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { data: meetup } = await supabase
    .from('meetups')
    .select('creator_id, title, max_participants')
    .eq('id', meetupId)
    .single()

  if (!meetup || meetup.creator_id !== user.id) return { success: false, error: 'Geen toegang' }

  const now = new Date().toISOString()
  await supabase
    .from('meetup_participants')
    .update({
      status: response,
      accepted_at: response === 'geaccepteerd' ? now : null,
      declined_at: response === 'geweigerd' ? now : null,
    } as Record<string, unknown>)
    .eq('meetup_id', meetupId)
    .eq('user_id', userId)

  if (response === 'geaccepteerd') {
    // Stuur systeem-bericht in chat
    const profile = await supabase.from('profiles').select('full_name, username').eq('id', userId).single()
    const name = profile.data?.full_name ?? profile.data?.username ?? 'Iemand'
    await supabase.from('meetup_messages').insert({
      meetup_id: meetupId,
      sender_id: userId,
      content: `${name} doet nu mee`,
      is_system: true,
    })

    // Check of max bereikt is
    const { count } = await supabase
      .from('meetup_participants')
      .select('*', { count: 'exact', head: true })
      .eq('meetup_id', meetupId)
      .eq('status', 'geaccepteerd')

    if (count !== null && count >= meetup.max_participants) {
      await supabase.from('meetups').update({ status: 'vol' }).eq('id', meetupId)
    }

    await sendNotification(
      supabase, userId, 'meetup_accepted',
      `Je bent geaccepteerd! Je kunt nu meedoen aan '${meetup.title}'. Je hebt nu toegang tot de chat.`,
      `/dashboard/meetup/${meetupId}`,
    )
    await logActivity(supabase, user.id, 'meetup_accepted', { meetup_id: meetupId, participant_id: userId })
  } else {
    await sendNotification(
      supabase, userId, 'meetup_declined',
      `Je verzoek voor Meetup '${meetup.title}' is niet geaccepteerd.`,
      `/dashboard/meetup`,
    )
    await logActivity(supabase, user.id, 'meetup_declined', { meetup_id: meetupId, participant_id: userId })
  }

  revalidatePath(`/dashboard/meetup/${meetupId}`)
  return { success: true }
}

// ─── 4. Meetup verlaten ────────────────────────────────────────────────────────

export async function leaveMeetup(meetupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { data: meetup } = await supabase.from('meetups').select('status, title').eq('id', meetupId).single()

  await supabase
    .from('meetup_participants')
    .delete()
    .eq('meetup_id', meetupId)
    .eq('user_id', user.id)

  // Als de meetup 'vol' was, zet terug naar 'open'
  if (meetup?.status === 'vol') {
    await supabase.from('meetups').update({ status: 'open' }).eq('id', meetupId)
  }

  // Systeem-bericht
  const profile = await supabase.from('profiles').select('full_name, username').eq('id', user.id).single()
  const name = profile.data?.full_name ?? profile.data?.username ?? 'Iemand'
  await supabase.from('meetup_messages').insert({
    meetup_id: meetupId,
    sender_id: user.id,
    content: `${name} heeft de Meetup verlaten`,
    is_system: true,
  })

  await logActivity(supabase, user.id, 'meetup_left', { meetup_id: meetupId })
  revalidatePath(`/dashboard/meetup/${meetupId}`)
  return { success: true }
}

// ─── 5. Meetup annuleren ──────────────────────────────────────────────────────

export async function cancelMeetup(meetupId: string, reason?: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { data: meetup } = await supabase
    .from('meetups').select('creator_id, title').eq('id', meetupId).single()
  if (!meetup || meetup.creator_id !== user.id) return { success: false, error: 'Geen toegang' }

  await supabase.from('meetups').update({ status: 'geannuleerd' }).eq('id', meetupId)

  // Notificeer alle deelnemers (interesse + geaccepteerd)
  const { data: allParticipants } = await supabase
    .from('meetup_participants').select('user_id')
    .eq('meetup_id', meetupId).in('status', ['geaccepteerd', 'interesse'])

  const message = reason
    ? `De Meetup '${meetup.title}' is geannuleerd. Reden: ${reason}`
    : `De Meetup '${meetup.title}' is geannuleerd`

  const profile = await supabase.from('profiles').select('full_name, username').eq('id', user.id).single()
  const name = profile.data?.full_name ?? profile.data?.username ?? 'Iemand'
  await supabase.from('meetup_messages').insert({
    meetup_id: meetupId, sender_id: user.id,
    content: `Meetup geannuleerd door ${name}${reason ? `. Reden: ${reason}` : ''}`,
    is_system: true,
  })

  for (const p of allParticipants ?? []) {
    await sendNotification(supabase, p.user_id, 'meetup_cancelled', message, '/dashboard/meetup')
  }

  await logActivity(supabase, user.id, 'meetup_cancelled', { meetup_id: meetupId })
  revalidatePath('/dashboard/meetup')
  return { success: true, error: null }
}

// ─── 6. Meetup-bericht sturen ─────────────────────────────────────────────────

export async function sendMeetupMessage(meetupId: string, content: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  // Check toegang (creator of geaccepteerde deelnemer)
  const { data: meetup } = await supabase.from('meetups').select('creator_id').eq('id', meetupId).single()
  const isCreator = meetup?.creator_id === user.id

  if (!isCreator) {
    const { data: participant } = await supabase
      .from('meetup_participants')
      .select('status')
      .eq('meetup_id', meetupId)
      .eq('user_id', user.id)
      .single()
    if (participant?.status !== 'geaccepteerd') return { success: false, error: 'Geen toegang tot chat' }
  }

  const { error } = await supabase.from('meetup_messages').insert({
    meetup_id: meetupId,
    sender_id: user.id,
    content: content.trim(),
    is_system: false,
  })

  if (error) return { success: false, error: error.message }

  await logActivity(supabase, user.id, 'meetup_message_sent', { meetup_id: meetupId })

  // Notificeer andere deelnemers
  try {
    const { data: meetupInfo } = await supabase.from('meetups').select('title, creator_id').eq('id', meetupId).single()
    const profile = await supabase.from('profiles').select('full_name, username').eq('id', user.id).single()
    const senderName = profile.data?.full_name ?? profile.data?.username ?? 'Iemand'

    const { data: otherParticipants } = await supabase
      .from('meetup_participants')
      .select('user_id')
      .eq('meetup_id', meetupId)
      .eq('status', 'geaccepteerd')
      .neq('user_id', user.id)

    const recipientIds = new Set((otherParticipants ?? []).map(p => p.user_id))
    if (meetupInfo?.creator_id && meetupInfo.creator_id !== user.id) recipientIds.add(meetupInfo.creator_id)

    for (const recipientId of recipientIds) {
      await sendNotification(
        supabase, recipientId, 'meetup_message',
        `${senderName} stuurde een bericht in '${meetupInfo?.title ?? 'meetup'}'`,
        `/dashboard/messages?meetup=${meetupId}`,
      )
    }
  } catch { /* notificatie optioneel */ }

  return { success: true }
}

// ─── 7. Meetups ophalen ────────────────────────────────────────────────────────

export type MeetupListItem = {
  id: string
  creatorId: string
  creatorName: string
  creatorAvatarUrl: string | null
  coverImageUrl: string | null
  sport: string
  title: string
  description: string | null
  locationName: string
  city: string
  latitude: number
  longitude: number
  isSpontaneous: boolean
  date: string | null
  time: string | null
  expiresAt: string | null
  maxParticipants: number
  status: string
  visibility: string
  acceptedCount: number
  interestedCount: number
  createdAt: string
  distanceKm?: number
  myStatus?: 'interesse' | 'geaccepteerd' | 'geweigerd' | null
  declinedAt?: string | null
}

export async function getMeetups(params: {
  latitude?: number
  longitude?: number
  radiusKm?: number
  sport?: string
  dateFilter?: 'vandaag' | 'morgen' | 'week' | 'spontaan' | 'alles'
  city?: string
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verloop spontane meetups
  try { await supabase.rpc('expire_spontaneous_meetups') } catch { /* ignore */ }

  let query = supabase
    .from('meetups')
    .select(`
      id, creator_id, sport, title, description, location_name, city,
      latitude, longitude, is_spontaneous, date, time, expires_at,
      max_participants, status, visibility, created_at, cover_image_url
    `)
    .in('status', ['open', 'vol'])
    .order('created_at', { ascending: false })
    .limit(100)

  if (params.sport && params.sport !== 'Alles') {
    query = query.eq('sport', params.sport)
  }
  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const weekLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  if (params.dateFilter === 'vandaag') {
    query = query.eq('date', today)
  } else if (params.dateFilter === 'morgen') {
    query = query.eq('date', tomorrow)
  } else if (params.dateFilter === 'week') {
    query = query.gte('date', today).lte('date', weekLater)
  } else if (params.dateFilter === 'spontaan') {
    query = query.eq('is_spontaneous', true)
  }

  const { data: meetups } = await query

  if (!meetups?.length) return []

  // Haal creators op
  const creatorIds = [...new Set(meetups.map(m => m.creator_id))]
  const { data: creators } = await supabase
    .from('profiles')
    .select('*')
    .in('id', creatorIds)
  const creatorMap = Object.fromEntries((creators ?? []).map(c => [c.id, c]))

  // Deelnemers tellen
  const meetupIds = meetups.map(m => m.id)
  const { data: participants } = await supabase
    .from('meetup_participants')
    .select('meetup_id, status, user_id, declined_at')
    .in('meetup_id', meetupIds)

  const acceptedMap: Record<string, number> = {}
  const interestedMap: Record<string, number> = {}
  const myStatusMap: Record<string, 'interesse' | 'geaccepteerd' | 'geweigerd'> = {}
  const myDeclinedAtMap: Record<string, string | null> = {}

  for (const p of participants ?? []) {
    if (p.status === 'geaccepteerd') acceptedMap[p.meetup_id] = (acceptedMap[p.meetup_id] ?? 0) + 1
    if (p.status === 'interesse') interestedMap[p.meetup_id] = (interestedMap[p.meetup_id] ?? 0) + 1
    if (user && p.user_id === user.id) {
      myStatusMap[p.meetup_id] = p.status as 'interesse' | 'geaccepteerd' | 'geweigerd'
      myDeclinedAtMap[p.meetup_id] = (p as Record<string, unknown>).declined_at as string | null ?? null
    }
  }

  return meetups.map(m => {
    const creator = creatorMap[m.creator_id]
    let distanceKm: number | undefined
    if (params.latitude !== undefined && params.longitude !== undefined) {
      // Haversine
      const R = 6371
      const dLat = (m.latitude - params.latitude) * Math.PI / 180
      const dLon = (m.longitude - params.longitude) * Math.PI / 180
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(params.latitude * Math.PI / 180) * Math.cos(m.latitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2
      distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      if (params.radiusKm && distanceKm > params.radiusKm) return null
    }

    return {
      id: m.id,
      creatorId: m.creator_id,
      creatorName: creator?.full_name ?? creator?.username ?? 'Onbekend',
      creatorAvatarUrl: creator?.avatar_url ?? null,
      coverImageUrl: m.cover_image_url ?? null,
      sport: m.sport,
      title: m.title,
      description: m.description,
      locationName: m.location_name,
      city: m.city,
      latitude: m.latitude,
      longitude: m.longitude,
      isSpontaneous: m.is_spontaneous,
      date: m.date,
      time: m.time,
      expiresAt: m.expires_at,
      maxParticipants: m.max_participants,
      status: m.status,
      visibility: m.visibility,
      acceptedCount: acceptedMap[m.id] ?? 0,
      interestedCount: interestedMap[m.id] ?? 0,
      createdAt: m.created_at,
      distanceKm,
      myStatus: myStatusMap[m.id] ?? null,
      declinedAt: myDeclinedAtMap[m.id] ?? null,
    } satisfies MeetupListItem
  }).filter(Boolean) as MeetupListItem[]
}

// ─── New types voor modal ─────────────────────────────────────────────────────

export type ModalParticipant = {
  userId: string
  name: string
  avatarUrl: string | null
  status: string
  message: string | null
  joinedAt: string | null
  attended: boolean
}

export type ModalCreator = {
  id: string
  name: string
  avatarUrl: string | null
  bannerUrl: string | null
  bio: string | null
  city: string | null
  sport: string | null
  meetupsHosted: number
  meetupsJoined: number
  meetupsAttended: number
  organizerRating: number | null
  organizerReviewCount: number
  createdAt: string
}

export type MeetupModalDetail = {
  meetup: {
    id: string
    creatorId: string
    sport: string
    title: string
    description: string | null
    locationName: string
    locationAddress: string | null
    city: string
    latitude: number
    longitude: number
    displayLat: number
    displayLon: number
    hasLocationAccess: boolean
    coverImageUrl: string | null
    isSpontaneous: boolean
    date: string | null
    time: string | null
    expiresAt: string | null
    maxParticipants: number
    status: string
    visibility: string
    createdAt: string
  }
  creator: ModalCreator
  acceptedParticipants: ModalParticipant[]
  interestedParticipants: ModalParticipant[]
  isCreator: boolean
  myStatus: string | null
  currentUserId: string | null
  myReviewSubmitted: boolean
}

// ─── 8b. Detail voor kaart-modal ─────────────────────────────────────────────

export async function getMeetupDetailForModal(meetupId: string): Promise<MeetupModalDetail | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: meetup } = await supabase
    .from('meetups').select('*').eq('id', meetupId).single()
  if (!meetup) return null

  const [{ data: creatorRaw }, { data: allParticipants }] = await Promise.all([
    supabase.from('profiles')
      .select('*')
      .eq('id', meetup.creator_id).single(),
    supabase.from('meetup_participants')
      .select('user_id, status, message, joined_at, attended')
      .eq('meetup_id', meetupId),
  ])

  if (!creatorRaw) return null

  // Stats kolommen bestaan pas na SQL-migratie — veilig ophalen
  let statsData = { meetups_hosted: 0, meetups_joined: 0, meetups_attended: 0, organizer_rating: null as number | null, organizer_review_count: 0 }
  try {
    const { data: stats } = await supabase.from('profiles')
      .select('meetups_hosted, meetups_joined, meetups_attended, organizer_rating, organizer_review_count')
      .eq('id', meetup.creator_id).single()
    if (stats) statsData = {
      meetups_hosted: (stats as Record<string, unknown>).meetups_hosted as number ?? 0,
      meetups_joined: (stats as Record<string, unknown>).meetups_joined as number ?? 0,
      meetups_attended: (stats as Record<string, unknown>).meetups_attended as number ?? 0,
      organizer_rating: (stats as Record<string, unknown>).organizer_rating as number | null ?? null,
      organizer_review_count: (stats as Record<string, unknown>).organizer_review_count as number ?? 0,
    }
  } catch { /* kolommen bestaan nog niet */ }

  const participantIds = (allParticipants ?? []).map(p => p.user_id)
  let profileMap: Record<string, { name: string; avatarUrl: string | null }> = {}
  if (participantIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles')
      .select('id, full_name, username, avatar_url').in('id', participantIds)
    profileMap = Object.fromEntries((profiles ?? []).map(p => [
      p.id, { name: p.full_name ?? p.username ?? 'Onbekend', avatarUrl: p.avatar_url ?? null }
    ]))
  }

  const isCreator = user?.id === meetup.creator_id
  const myParticipant = user ? (allParticipants ?? []).find(p => p.user_id === user.id) : null
  const myStatus = myParticipant?.status ?? null
  const hasLocationAccess = isCreator || myStatus === 'geaccepteerd'

  let myReviewSubmitted = false
  if (user && !isCreator) {
    try {
      const { data: rev } = await supabase.from('meetup_reviews')
        .select('id').eq('meetup_id', meetupId).eq('reviewer_id', user.id).maybeSingle()
      myReviewSubmitted = !!rev
    } catch { /* tabel bestaat nog niet */ }
  }

  const toParticipant = (p: { user_id: string; status: string; message: string | null; joined_at: string | null; attended: boolean | null }): ModalParticipant => ({
    userId: p.user_id,
    name: profileMap[p.user_id]?.name ?? 'Onbekend',
    avatarUrl: profileMap[p.user_id]?.avatarUrl ?? null,
    status: p.status,
    message: p.message ?? null,
    joinedAt: p.joined_at ?? null,
    attended: p.attended ?? false,
  })

  return {
    meetup: {
      id: meetup.id,
      creatorId: meetup.creator_id,
      sport: meetup.sport,
      title: meetup.title,
      description: meetup.description,
      locationName: meetup.location_name,
      locationAddress: meetup.location_address ?? null,
      city: meetup.city,
      latitude: meetup.latitude,
      longitude: meetup.longitude,
      displayLat: hasLocationAccess ? meetup.latitude : Math.round(meetup.latitude * 100) / 100,
      displayLon: hasLocationAccess ? meetup.longitude : Math.round(meetup.longitude * 100) / 100,
      hasLocationAccess,
      coverImageUrl: meetup.cover_image_url ?? null,
      isSpontaneous: meetup.is_spontaneous,
      date: meetup.date,
      time: meetup.time,
      expiresAt: meetup.expires_at,
      maxParticipants: meetup.max_participants,
      status: meetup.status,
      visibility: meetup.visibility,
      createdAt: meetup.created_at,
    },
    creator: {
      id: creatorRaw.id,
      name: creatorRaw?.full_name ?? (creatorRaw as unknown as { username?: string })?.username ?? 'Onbekend',
      avatarUrl: creatorRaw?.avatar_url ?? null,
      bannerUrl: (creatorRaw as unknown as { banner_url?: string | null })?.banner_url ?? null,
      bio: creatorRaw?.bio ?? null,
      city: (creatorRaw as unknown as { city?: string | null })?.city ?? null,
      sport: (creatorRaw as unknown as { sport?: string | null })?.sport ?? null,
      meetupsHosted: statsData.meetups_hosted,
      meetupsJoined: statsData.meetups_joined,
      meetupsAttended: statsData.meetups_attended,
      organizerRating: statsData.organizer_rating,
      organizerReviewCount: statsData.organizer_review_count,
      createdAt: (creatorRaw as unknown as { created_at?: string })?.created_at ?? new Date().toISOString(),
    },
    acceptedParticipants: (allParticipants ?? [])
      .filter(p => p.status === 'geaccepteerd')
      .map(p => toParticipant(p as Parameters<typeof toParticipant>[0])),
    interestedParticipants: (allParticipants ?? [])
      .filter(p => p.status === 'interesse')
      .map(p => toParticipant(p as Parameters<typeof toParticipant>[0])),
    isCreator,
    myStatus,
    currentUserId: user?.id ?? null,
    myReviewSubmitted,
  }
}

// ─── 9. Aanwezigheid bevestigen ───────────────────────────────────────────────

export async function markAttended(meetupId: string, targetUserId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: meetup } = await supabase.from('meetups')
    .select('creator_id').eq('id', meetupId).single()
  if (!meetup || meetup.creator_id !== user.id) return { success: false }

  await supabase.from('meetup_participants')
    .update({ attended: true, confirmed_at: new Date().toISOString() })
    .eq('meetup_id', meetupId).eq('user_id', targetUserId).eq('status', 'geaccepteerd')

  revalidatePath(`/dashboard/meetup/${meetupId}`)
  return { success: true }
}

// ─── 10. Review indienen ──────────────────────────────────────────────────────

export async function submitReview(meetupId: string, organizerId: string, rating: number) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }
  if (rating < 1 || rating > 5) return { success: false, error: 'Ongeldige rating' }

  try {
    const { error } = await supabase.from('meetup_reviews')
      .insert({ meetup_id: meetupId, reviewer_id: user.id, organizer_id: organizerId, rating })
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch {
    return { success: false, error: 'Review-tabel bestaat nog niet' }
  }
}

// ─── 11. Deelnemer verwijderen (organisator) ──────────────────────────────────

export async function removeParticipant(meetupId: string, targetUserId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false }

  const { data: meetup } = await supabase.from('meetups')
    .select('creator_id, status, title').eq('id', meetupId).single()
  if (!meetup || meetup.creator_id !== user.id) return { success: false }

  await supabase.from('meetup_participants')
    .delete().eq('meetup_id', meetupId).eq('user_id', targetUserId)

  if (meetup.status === 'vol') {
    await supabase.from('meetups').update({ status: 'open' }).eq('id', meetupId)
  }

  await sendNotification(supabase, targetUserId, 'meetup_removed',
    `Je bent verwijderd uit de Meetup '${meetup.title}'.`, '/dashboard/meetup')
  await logActivity(supabase, user.id, 'meetup_participant_removed', { meetup_id: meetupId, removed_user: targetUserId })

  revalidatePath(`/dashboard/meetup/${meetupId}`)
  return { success: true }
}

// ─── 8. Meetup detail ophalen ─────────────────────────────────────────────────

export async function getMeetupDetail(meetupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: meetup } = await supabase
    .from('meetups')
    .select('*')
    .eq('id', meetupId)
    .single()

  if (!meetup) return null

  const [{ data: creator }, { data: participants }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, username, avatar_url, bio').eq('id', meetup.creator_id).single(),
    supabase.from('meetup_participants').select('user_id, status, message, joined_at').eq('meetup_id', meetupId),
  ])

  const participantUserIds = (participants ?? []).map(p => p.user_id)
  let profileMap: Record<string, { full_name: string | null; username: string | null; avatar_url: string | null }> = {}
  if (participantUserIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url')
      .in('id', participantUserIds)
    profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  }

  const myParticipant = user ? (participants ?? []).find(p => p.user_id === user.id) : null
  const isCreator = user?.id === meetup.creator_id

  return {
    meetup,
    creator,
    participants: (participants ?? []).map(p => ({
      ...p,
      name: profileMap[p.user_id]?.full_name ?? profileMap[p.user_id]?.username ?? 'Onbekend',
      avatarUrl: profileMap[p.user_id]?.avatar_url ?? null,
    })),
    isCreator,
    myStatus: myParticipant?.status ?? null,
    currentUserId: user?.id ?? null,
  }
}

// ─── 12. Meetup bijwerken ─────────────────────────────────────────────────────

export async function updateMeetup(meetupId: string, updates: {
  title?: string
  description?: string
  date?: string
  time?: string
  maxParticipants?: number
  locationName?: string
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { data: meetup } = await supabase.from('meetups').select('creator_id').eq('id', meetupId).single()
  if (!meetup || meetup.creator_id !== user.id) return { success: false, error: 'Geen toegang' }

  const patch: Record<string, unknown> = {}
  if (updates.title !== undefined) patch.title = updates.title
  if (updates.description !== undefined) patch.description = updates.description || null
  if (updates.date !== undefined) patch.date = updates.date || null
  if (updates.time !== undefined) patch.time = updates.time || null
  if (updates.maxParticipants !== undefined) patch.max_participants = updates.maxParticipants
  if (updates.locationName !== undefined) patch.location_name = updates.locationName

  const { error } = await supabase.from('meetups').update(patch).eq('id', meetupId)
  if (error) return { success: false, error: error.message }

  await logActivity(supabase, user.id, 'meetup_updated', { meetup_id: meetupId })
  revalidatePath(`/dashboard/meetup/${meetupId}`)
  revalidatePath('/dashboard/meetup')
  return { success: true, error: null }
}

// ─── 13. Meetup definitief verwijderen ────────────────────────────────────────

export async function deleteMeetup(meetupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { data: meetup } = await supabase.from('meetups')
    .select('creator_id, title').eq('id', meetupId).single()
  if (!meetup || meetup.creator_id !== user.id) return { success: false, error: 'Geen toegang' }

  // Notificeer deelnemers vóór verwijderen
  const { data: participants } = await supabase.from('meetup_participants')
    .select('user_id').eq('meetup_id', meetupId).in('status', ['geaccepteerd', 'interesse'])

  for (const p of participants ?? []) {
    await sendNotification(supabase, p.user_id, 'meetup_deleted',
      `De Meetup '${meetup.title}' is verwijderd door de organisator.`, '/dashboard/meetup')
  }

  await logActivity(supabase, user.id, 'meetup_deleted', { meetup_id: meetupId })

  await supabase.from('meetup_messages').delete().eq('meetup_id', meetupId)
  await supabase.from('meetup_participants').delete().eq('meetup_id', meetupId)
  await supabase.from('meetups').delete().eq('id', meetupId)

  revalidatePath('/dashboard/meetup')
  return { success: true, error: null }
}

// ─── 14. Interesse intrekken ──────────────────────────────────────────────────

export async function withdrawInterest(meetupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  await supabase.from('meetup_participants')
    .delete().eq('meetup_id', meetupId).eq('user_id', user.id).eq('status', 'interesse')

  revalidatePath(`/dashboard/meetup/${meetupId}`)
  return { success: true, error: null }
}

// ─── 15. Inschrijvingen sluiten ───────────────────────────────────────────────

export async function closeMeetup(meetupId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { data: meetup } = await supabase.from('meetups').select('creator_id').eq('id', meetupId).single()
  if (!meetup || meetup.creator_id !== user.id) return { success: false, error: 'Geen toegang' }

  await supabase.from('meetups').update({ status: 'vol' }).eq('id', meetupId)
  revalidatePath(`/dashboard/meetup/${meetupId}`)
  return { success: true, error: null }
}

// ─── 16. Aanwezigheid batch bevestigen ───────────────────────────────────────

export async function confirmAttendance(meetupId: string, attendees: string[]) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { data: meetup } = await supabase.from('meetups').select('creator_id').eq('id', meetupId).single()
  if (!meetup || meetup.creator_id !== user.id) return { success: false, error: 'Geen toegang' }

  if (attendees.length > 0) {
    await supabase.from('meetup_participants')
      .update({ attended: true, confirmed_at: new Date().toISOString() })
      .eq('meetup_id', meetupId).in('user_id', attendees).eq('status', 'geaccepteerd')
  }

  await logActivity(supabase, user.id, 'meetup_attendance_confirmed', { meetup_id: meetupId, count: attendees.length })
  revalidatePath(`/dashboard/meetup/${meetupId}`)
  return { success: true, error: null }
}

// ─── 17. Meetup berichten ophalen ─────────────────────────────────────────────

export type MeetupMessageItem = {
  id: string
  meetupId: string
  senderId: string
  senderName: string
  senderAvatarUrl: string | null
  content: string
  isSystem: boolean
  createdAt: string
}

export async function getMeetupMessages(meetupId: string): Promise<{ data: MeetupMessageItem[]; error: string | null }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Niet ingelogd' }

  // Toegangscontrole: creator of geaccepteerde deelnemer
  const { data: meetup } = await supabase.from('meetups').select('creator_id').eq('id', meetupId).single()
  if (!meetup) return { data: [], error: 'Meetup niet gevonden' }

  const isCreator = meetup.creator_id === user.id
  if (!isCreator) {
    const { data: participant } = await supabase
      .from('meetup_participants').select('status')
      .eq('meetup_id', meetupId).eq('user_id', user.id).single()
    if (participant?.status !== 'geaccepteerd') return { data: [], error: 'Geen toegang' }
  }

  const { data: messages, error } = await supabase
    .from('meetup_messages')
    .select('id, meetup_id, sender_id, content, is_system, created_at')
    .eq('meetup_id', meetupId)
    .order('created_at', { ascending: true })

  if (error) return { data: [], error: error.message }

  // Haal senderprofielen op
  const senderIds = [...new Set((messages ?? []).filter(m => !m.is_system).map(m => m.sender_id))]
  let profileMap: Record<string, { name: string; avatarUrl: string | null }> = {}
  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles').select('id, full_name, username, avatar_url').in('id', senderIds)
    profileMap = Object.fromEntries((profiles ?? []).map(p => [
      p.id, { name: p.full_name ?? p.username ?? 'Onbekend', avatarUrl: p.avatar_url ?? null }
    ]))
  }

  return {
    data: (messages ?? []).map(m => ({
      id: m.id,
      meetupId: m.meetup_id,
      senderId: m.sender_id,
      senderName: profileMap[m.sender_id]?.name ?? 'Onbekend',
      senderAvatarUrl: profileMap[m.sender_id]?.avatarUrl ?? null,
      content: m.content,
      isSystem: m.is_system ?? false,
      createdAt: m.created_at,
    })),
    error: null,
  }
}

// ─── 18. Geweigerd deelnemer verwijderen na 24u ───────────────────────────────

export async function clearDeclinedParticipant(meetupId: string): Promise<{ cleared: boolean }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { cleared: false }

  const { data: participant } = await supabase
    .from('meetup_participants')
    .select('status, declined_at')
    .eq('meetup_id', meetupId)
    .eq('user_id', user.id)
    .single()

  if (!participant || participant.status !== 'geweigerd') return { cleared: false }

  const declinedAt = (participant as Record<string, unknown>).declined_at as string | null
  if (!declinedAt) return { cleared: false }

  const hoursSinceDecline = (Date.now() - new Date(declinedAt).getTime()) / 3600000
  if (hoursSinceDecline < 24) return { cleared: false }

  await supabase.from('meetup_participants')
    .delete().eq('meetup_id', meetupId).eq('user_id', user.id)

  return { cleared: true }
}
