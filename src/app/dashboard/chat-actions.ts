'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ── Feature 5: Last seen ──────────────────────────────────────────────────────
export async function updateLastSeen() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id)
}

// ── Feature 6: Read receipts — admin client bypast RLS ────────────────────────
export async function markMessagesAsRead(conversationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  const admin = createAdminClient()
  await admin
    .from('chat_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null)

  return { success: true }
}

// ── Berichtverwijdering ───────────────────────────────────────────────────────
export async function deleteMessageForAll(messageId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  const admin = createAdminClient()

  // Verificeer: bericht bestaat en is van ons
  const { data: msg } = await admin
    .from('chat_messages')
    .select('sender_id, read_at')
    .eq('id', messageId)
    .single()

  if (!msg) return { error: 'Bericht niet gevonden' }
  if (msg.sender_id !== user.id) return { error: 'Geen toegang' }

  await admin
    .from('chat_messages')
    .update({ deleted_for_all: true, content: '' })
    .eq('id', messageId)

  return { success: true }
}

export async function deleteMessageForMe(messageId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  await supabase.from('deleted_messages').upsert(
    { message_id: messageId, user_id: user.id },
    { onConflict: 'message_id,user_id' }
  )

  return { success: true }
}

// ── Feature 3: Emoji reacties ─────────────────────────────────────────────────
export async function toggleReaction(messageId: string, emoji: string) {
  const ALLOWED_EMOJI = ['👍', '❤️', '😂', '🔥', '💪', '🎯']
  if (!ALLOWED_EMOJI.includes(emoji)) return { error: 'Ongeldige emoji' }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  // Controleer of de reactie al bestaat
  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single()

  if (existing) {
    await supabase.from('message_reactions').delete().eq('id', existing.id)
  } else {
    await supabase.from('message_reactions').insert({
      message_id: messageId,
      user_id: user.id,
      emoji,
    })
  }

  // Geef alle reacties voor dit bericht terug
  const { data: reactions } = await supabase
    .from('message_reactions')
    .select('id, message_id, user_id, emoji')
    .eq('message_id', messageId)

  return { success: true, reactions: reactions ?? [] }
}

// ── Feature 2: Training afspraken ─────────────────────────────────────────────
export async function createAppointment(
  conversationId: string,
  proposedToId: string,
  sport: string | null,
  location: string,
  proposedDate: string,  // ISO string
  notes: string,
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  // Controleer of gebruiker deelnemer is
  const { data: conv } = await supabase
    .from('follow_requests')
    .select('from_user_id, to_user_id')
    .eq('id', conversationId)
    .eq('status', 'accepted')
    .single()

  if (!conv || (conv.from_user_id !== user.id && conv.to_user_id !== user.id)) {
    return { error: 'Geen toegang tot deze conversatie' }
  }

  // Maak afspraak aan
  const { data: appt, error: apptError } = await supabase
    .from('training_appointments')
    .insert({
      conversation_id: conversationId,
      proposed_by: user.id,
      proposed_to: proposedToId,
      sport,
      location,
      proposed_date: proposedDate,
      notes: notes || null,
    })
    .select()
    .single()

  if (apptError || !appt) return { error: 'Afspraak kon niet worden aangemaakt' }

  // Stuur een berichtkaart in de chat
  await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: appt.id,
    message_type: 'appointment',
  })

  return { success: true, appointmentId: appt.id }
}

export async function respondToAppointment(
  appointmentId: string,
  response: 'accepted' | 'declined',
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  const { error } = await supabase
    .from('training_appointments')
    .update({ status: response, responded_at: new Date().toISOString() })
    .eq('id', appointmentId)
    .eq('proposed_to', user.id)  // alleen de ontvanger mag reageren
    .eq('status', 'pending')     // alleen pending afspraken

  if (error) return { error: 'Reactie kon niet worden opgeslagen' }
  return { success: true }
}

// ── Feature 4: Afbeeldingen ───────────────────────────────────────────────────
// Upload wordt client-side gedaan via Supabase browser client.
// Alleen het insert van het bericht gaat via server action:
export async function sendImageMessage(
  conversationId: string,
  imageUrl: string,
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  // Controleer URL is van onze eigen Supabase storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || !imageUrl.startsWith(supabaseUrl)) {
    return { error: 'Ongeldige afbeelding URL' }
  }

  const { error } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: '',
    message_type: 'image',
    image_url: imageUrl,
  })

  if (error) return { error: 'Afbeelding kon niet worden verzonden' }
  return { success: true }
}
