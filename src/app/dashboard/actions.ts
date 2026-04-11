'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function acceptBuddyRequest(requestId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  const now = new Date().toISOString()

  // Haal het verzoek op
  const { data: req, error: fetchError } = await supabase
    .from('follow_requests')
    .select('*')
    .eq('id', requestId)
    .eq('to_user_id', user.id)
    .single()

  if (fetchError || !req) return { error: 'Verzoek niet gevonden' }

  // Update follow_requests status
  await supabase
    .from('follow_requests')
    .update({ status: 'accepted', accepted_at: now })
    .eq('id', requestId)

  // Sla ook op in matches tabel voor admin statistieken
  await supabase
    .from('matches')
    .upsert({
      from_user_id: req.from_user_id,
      to_user_id: req.to_user_id,
      status: 'accepted',
      sport: req.sport ?? null,
      requested_at: req.created_at,
      accepted_at: now,
    }, { onConflict: 'from_user_id,to_user_id' })

  // Log in activity_log
  await supabase
    .from('activity_log')
    .insert({
      user_id: user.id,
      event_type: 'match_accepted',
      metadata: { request_id: requestId, other_user_id: req.from_user_id, sport: req.sport ?? null },
    })

  revalidatePath('/dashboard/notifications')
  revalidatePath('/dashboard/messages')
  return { success: true }
}

export async function declineBuddyRequest(requestId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  const now = new Date().toISOString()

  const { data: req } = await supabase
    .from('follow_requests')
    .select('*')
    .eq('id', requestId)
    .eq('to_user_id', user.id)
    .single()

  await supabase
    .from('follow_requests')
    .update({ status: 'declined', declined_at: now })
    .eq('id', requestId)

  // Log in matches als declined
  if (req) {
    await supabase
      .from('matches')
      .upsert({
        from_user_id: req.from_user_id,
        to_user_id: req.to_user_id,
        status: 'declined',
        sport: req.sport ?? null,
        requested_at: req.created_at,
        declined_at: now,
      }, { onConflict: 'from_user_id,to_user_id' })

    // Log in activity_log
    await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        event_type: 'match_declined',
        metadata: { request_id: requestId, other_user_id: req.from_user_id, sport: req.sport ?? null },
      })
  }

  revalidatePath('/dashboard/notifications')
  return { success: true }
}
