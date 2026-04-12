import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import MeetupPageClient from './_components/MeetupPageClient'
import { getMeetups } from '@/app/actions/meetups'

export default async function MeetupPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('region, latitude, longitude')
    .eq('id', user.id)
    .single()

  // Standaard: Amsterdam als lat/lng niet beschikbaar
  const lat = (profile as any)?.latitude ?? 52.3676
  const lng = (profile as any)?.longitude ?? 4.9041

  const meetups = await getMeetups({ latitude: lat, longitude: lng, radiusKm: 50 })

  return (
    <MeetupPageClient
      initialMeetups={meetups}
      center={[lat, lng]}
      currentUserId={user.id}
    />
  )
}
