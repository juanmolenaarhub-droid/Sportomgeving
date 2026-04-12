import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { getMeetupDetail } from '@/app/actions/meetups'
import MeetupDetailClient from './_components/MeetupDetailClient'

export default async function MeetupDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const detail = await getMeetupDetail(params.id)
  if (!detail) notFound()

  return <MeetupDetailClient detail={detail} />
}
