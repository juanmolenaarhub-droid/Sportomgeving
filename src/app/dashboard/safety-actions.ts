'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export const REPORT_CATEGORIES = [
  'Ongepaste of beledigende berichten',
  'Intimidatie of bedreiging',
  'Spam of nep-profiel',
  'Minderjarige gebruiker',
  'Gevaarlijk of grensoverschrijdend gedrag',
  'Haatdragende of discriminerende uitingen',
  'Overig',
] as const

export async function reportUser(
  reportedUserId: string,
  category: string,
  description?: string,
  conversationId?: string,
  blockAlso?: boolean,
) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  if (user.id === reportedUserId) return { error: 'Je kunt jezelf niet rapporteren' }
  if (!(REPORT_CATEGORIES as readonly string[]).includes(category)) return { error: 'Ongeldige categorie' }

  // Rate limiting: max 3 rapporten per dag per reporter
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('reporter_id', user.id)
    .gte('created_at', today.toISOString())

  if ((count ?? 0) >= 3) return { error: 'Je kunt maximaal 3 rapporten per dag indienen' }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_user_id: reportedUserId,
    conversation_id: conversationId ?? null,
    category,
    description: description?.trim() || null,
  })

  if (error) return { error: 'Rapport kon niet worden ingediend' }

  await supabase.from('activity_log').insert({
    user_id: user.id,
    event_type: 'user_reported',
    metadata: { reported_user_id: reportedUserId, category },
  })

  if (blockAlso) {
    await supabase.from('blocked_users').upsert({
      blocker_id: user.id,
      blocked_id: reportedUserId,
    }, { onConflict: 'blocker_id,blocked_id' })
    revalidatePath('/dashboard/find')
  }

  return { success: true }
}

export async function blockUser(blockedUserId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }
  if (user.id === blockedUserId) return { error: 'Je kunt jezelf niet blokkeren' }

  const { error } = await supabase.from('blocked_users').upsert({
    blocker_id: user.id,
    blocked_id: blockedUserId,
  }, { onConflict: 'blocker_id,blocked_id' })

  if (error) return { error: 'Blokkeer actie mislukt' }

  revalidatePath('/dashboard/find')
  return { success: true }
}

export async function deleteConversation(conversationId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Niet ingelogd' }

  // Controleer of gebruiker deelnemer is
  const { data: req } = await supabase
    .from('follow_requests')
    .select('from_user_id, to_user_id')
    .eq('id', conversationId)
    .single()

  if (!req || (req.from_user_id !== user.id && req.to_user_id !== user.id)) {
    return { error: 'Geen toegang tot deze conversatie' }
  }

  // Soft delete voor deze gebruiker
  await supabase.from('deleted_conversations').upsert({
    conversation_id: conversationId,
    user_id: user.id,
  }, { onConflict: 'conversation_id,user_id' })

  // Check of beide partijen hebben verwijderd
  const admin = createAdminClient()
  const { count } = await admin
    .from('deleted_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)

  if ((count ?? 0) >= 2) {
    // Hard delete: verwijder berichten en soft-delete rijen
    await admin.from('chat_messages').delete().eq('conversation_id', conversationId)
    await admin.from('deleted_conversations').delete().eq('conversation_id', conversationId)
  }

  await supabase.from('activity_log').insert({
    user_id: user.id,
    event_type: 'conversation_deleted',
    metadata: { conversation_id: conversationId },
  })

  revalidatePath('/dashboard/messages')
  return { success: true }
}
