'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─── Types ────────────────────────────────────────────────────────────────────

export type UpdateProfileInput = {
  full_name: string
  username: string
  bio?: string
  region?: string
  website?: string
  phone?: string
  birth_date?: string
  training_location?: string
}

export type PrivacySettingsInput = {
  show_city: boolean
  show_age: boolean
  is_searchable: boolean
  show_in_find: boolean
  show_online_status: boolean
}

export type NotificationSettingsInput = {
  notify_buddy_request: boolean
  notify_match: boolean
  notify_message: boolean
  notify_like: boolean
  notify_comment: boolean
  email_weekly: boolean
  email_buddy_request: boolean
  email_news: boolean
}

export type SportSettingsInput = {
  sport: string
  niveau: 'beginner' | 'intermediate' | 'advanced'
  beschikbaarheid: string[]
}

// ─── Helper: activity log ─────────────────────────────────────────────────────

async function logActivity(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  eventType: string,
  metadata: Record<string, unknown>,
) {
  try {
    await supabase.from('activity_log').insert({ user_id: userId, event_type: eventType, metadata })
  } catch { /* log table may not exist */ }
}

// ─── 1. Profiel opslaan ───────────────────────────────────────────────────────

export async function updateProfile(input: UpdateProfileInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  // Valideer username uniekheid (exclusief huidige user)
  if (input.username) {
    const clean = input.username.replace(/^@/, '').toLowerCase().trim()
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', clean)
      .neq('id', user.id)
      .maybeSingle()
    if (existing) return { success: false, error: 'Deze gebruikersnaam is al in gebruik' }
  }

  const changedFields = Object.keys(input).filter(k => input[k as keyof UpdateProfileInput] !== undefined)

  const { error } = await supabase.from('profiles').update({
    full_name: input.full_name.trim(),
    username: input.username.replace(/^@/, '').toLowerCase().trim(),
    bio: input.bio?.trim() ?? null,
    region: input.region?.trim() ?? null,
    website: input.website?.trim() ?? null,
    phone: input.phone?.trim() ?? null,
    birth_date: input.birth_date ?? null,
    training_location: input.training_location?.trim() ?? null,
  }).eq('id', user.id)

  if (error) return { success: false, error: error.message }

  await logActivity(supabase, user.id, 'profile_updated', { fields_changed: changedFields })
  revalidatePath('/dashboard/profile/me')
  return { success: true }
}

// ─── 2. Privacy instellingen ──────────────────────────────────────────────────

export async function updatePrivacySettings(input: PrivacySettingsInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase.from('profiles').update({
    show_city: input.show_city,
    show_age: input.show_age,
    is_searchable: input.is_searchable,
    show_in_find: input.show_in_find,
    show_online_status: input.show_online_status,
  }).eq('id', user.id)

  if (error) return { success: false, error: error.message }

  await logActivity(supabase, user.id, 'privacy_updated', { ...input })
  revalidatePath('/dashboard/find')
  return { success: true }
}

// ─── 3. Notificatie instellingen ──────────────────────────────────────────────

export async function updateNotificationSettings(input: NotificationSettingsInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const upserts = Object.entries(input).map(([key, value]) => ({
    user_id: user.id,
    key,
    value: String(value),
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('user_settings')
    .upsert(upserts, { onConflict: 'user_id,key' })

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettingsInput> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('user_settings')
    .select('key, value')
    .eq('user_id', userId)

  const map: Record<string, boolean> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value === 'true'
  }

  return {
    notify_buddy_request: map['notify_buddy_request'] ?? true,
    notify_match:         map['notify_match']         ?? true,
    notify_message:       map['notify_message']       ?? true,
    notify_like:          map['notify_like']           ?? true,
    notify_comment:       map['notify_comment']        ?? true,
    email_weekly:         map['email_weekly']          ?? false,
    email_buddy_request:  map['email_buddy_request']   ?? false,
    email_news:           map['email_news']            ?? false,
  }
}

// ─── 4. Sport instellingen ────────────────────────────────────────────────────

export async function updateSportSettings(input: SportSettingsInput): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase.from('profiles').update({
    beschikbaarheid: input.beschikbaarheid,
  }).eq('id', user.id)

  if (error) return { success: false, error: error.message }

  // Update primaire sport in user_sports
  const { data: sportRow } = await supabase
    .from('sports')
    .select('id')
    .eq('name', input.sport)
    .maybeSingle()

  if (sportRow) {
    const { data: existing } = await supabase
      .from('user_sports')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (existing) {
      await supabase.from('user_sports')
        .update({ sport_id: sportRow.id, level: input.niveau })
        .eq('user_id', user.id)
        .eq('id', existing.id)
    } else {
      await supabase.from('user_sports').insert({
        user_id: user.id,
        sport_id: sportRow.id,
        level: input.niveau,
      })
    }
  }

  await logActivity(supabase, user.id, 'sport_updated', { sport: input.sport, niveau: input.niveau })
  revalidatePath('/dashboard/profile/me')
  return { success: true }
}

// ─── 5. E-mail wijzigen ───────────────────────────────────────────────────────

export async function updateAccountEmail(newEmail: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase.auth.updateUser({ email: newEmail })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ─── 6. Wachtwoord wijzigen ───────────────────────────────────────────────────

export async function updateAccountPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, error: 'Niet ingelogd' }

  // Verificeer huidig wachtwoord
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInError) return { success: false, error: 'Huidig wachtwoord klopt niet' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { success: false, error: error.message }

  await logActivity(supabase, user.id, 'password_changed', {})
  return { success: true }
}

// ─── 7. Blokkeer / deblokkeer ─────────────────────────────────────────────────

export async function unblockUser(blockedUserId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedUserId)

  if (error) return { success: false, error: error.message }

  await logActivity(supabase, user.id, 'user_unblocked', { unblocked_user_id: blockedUserId })
  revalidatePath('/dashboard/instellingen/privacy')
  return { success: true }
}

// ─── 8. Account deactiveren ───────────────────────────────────────────────────

export async function deactivateAccount(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ is_active: false })
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }

  await logActivity(supabase, user.id, 'account_deactivated', {})
  return { success: true }
}

// ─── 9. Check notificatie-instelling voor ontvanger ──────────────────────────

export async function shouldNotify(userId: string, key: keyof NotificationSettingsInput): Promise<boolean> {
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('user_settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle()

  // Default true als er geen instelling is
  if (!data) return true
  return data.value === 'true'
}
