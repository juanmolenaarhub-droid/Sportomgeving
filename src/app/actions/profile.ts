'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// ─── Constants ────────────────────────────────────────────────────────────────

const RESERVED = ['admin', 'buddys', 'support', 'help', 'api', 'www', 'root', 'system', 'moderator', 'mod', 'staff', 'official']

const USERNAME_RE = /^[a-z0-9_\.]{3,30}$/

// ─── checkUsernameAvailability ────────────────────────────────────────────────

export type UsernameCheckResult =
  | { available: true }
  | { available: false; reason: 'taken' | 'invalid' | 'too_short' | 'too_long' | 'reserved' }

export async function checkUsernameAvailability(username: string): Promise<UsernameCheckResult> {
  const u = username.toLowerCase().trim()

  if (u.length < 3)  return { available: false, reason: 'too_short' }
  if (u.length > 30) return { available: false, reason: 'too_long' }
  if (!USERNAME_RE.test(u)) return { available: false, reason: 'invalid' }
  if (RESERVED.includes(u)) return { available: false, reason: 'reserved' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('id')
    .ilike('username', u)
    .maybeSingle()

  if (error) {
    // On unexpected error, optimistically allow (form will catch DB constraint)
    return { available: true }
  }

  return data ? { available: false, reason: 'taken' } : { available: true }
}

// ─── setInitialUsername ───────────────────────────────────────────────────────

export async function setInitialUsername(
  username: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const u = username.toLowerCase().trim()

  const check = await checkUsernameAvailability(u)
  if (!check.available) {
    const msgs: Record<string, string> = {
      taken:     'Deze gebruikersnaam is al in gebruik.',
      invalid:   'Gebruikersnaam mag alleen letters, cijfers, _ en . bevatten.',
      too_short: 'Gebruikersnaam moet minimaal 3 tekens bevatten.',
      too_long:  'Gebruikersnaam mag maximaal 30 tekens bevatten.',
      reserved:  'Deze gebruikersnaam is gereserveerd.',
    }
    return { success: false, error: msgs[check.reason] ?? 'Gebruikersnaam niet beschikbaar.' }
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd.' }

  // Only set if username is currently NULL
  const { data: prof } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  if (prof?.username) {
    return { success: false, error: 'Gebruikersnaam is al ingesteld en kan niet worden gewijzigd.' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ username: u })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Deze gebruikersnaam is net bezet geraakt. Kies een andere.' }
    }
    return { success: false, error: 'Er is iets misgegaan. Probeer het opnieuw.' }
  }

  // Log activity
  await admin.from('activity_log').insert({
    user_id: user.id,
    event_type: 'username_set',
    metadata: { username: u },
  })

  return { success: true }
}
