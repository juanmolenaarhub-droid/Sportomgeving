'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { randomUUID } from 'crypto'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportReason =
  | 'spam'
  | 'nep_profiel'
  | 'ongepast_gedrag'
  | 'intimidatie'
  | 'ongepaste_foto'
  | 'overig'

export type AvgRequestType =
  | 'inzage'
  | 'correctie'
  | 'verwijdering'
  | 'overdracht'
  | 'bezwaar'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const MAX_IMAGE_BYTES = 5 * 1024 * 1024  // 5 MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50 MB

// ─── uploadFile ───────────────────────────────────────────────────────────────

export async function uploadFile(
  file: File,
  bucket: string,
  _legacyUserId?: string,
): Promise<{ success: true; url: string; path: string } | { success: false; error: string }> {
  const supabase = await createServerSupabaseClient()
  const admin    = createAdminClient()

  // Always use the authenticated user — never trust a caller-supplied userId
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd.' }
  const userId = user.id

  const isVideo   = ALLOWED_VIDEO_TYPES.includes(file.type)
  const isImage   = ALLOWED_IMAGE_TYPES.includes(file.type)
  const maxBytes  = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES

  // 1. Type check
  if (!isImage && !isVideo) {
    await admin.from('upload_log').insert({
      user_id:       userId,
      file_name:     file.name,
      file_type:     file.type,
      file_size_bytes: file.size,
      bucket,
      storage_path:  '',
      upload_status: 'blocked',
      block_reason:  'invalid_type',
    })
    return { success: false, error: 'Bestandstype niet toegestaan.' }
  }

  // 2. Grootte check
  if (file.size > maxBytes) {
    await admin.from('upload_log').insert({
      user_id:       userId,
      file_name:     file.name,
      file_type:     file.type,
      file_size_bytes: file.size,
      bucket,
      storage_path:  '',
      upload_status: 'blocked',
      block_reason:  'too_large',
    })
    return { success: false, error: `Bestand te groot (max ${isVideo ? '50' : '5'} MB).` }
  }

  // 3. Veilige bestandsnaam
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
  const path = `${userId}/${randomUUID()}.${ext}`

  // 4. Upload
  const arrayBuffer = await file.arrayBuffer()
  const { error: upErr } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (upErr) {
    await admin.from('upload_log').insert({
      user_id:       userId,
      file_name:     file.name,
      file_type:     file.type,
      file_size_bytes: file.size,
      bucket,
      storage_path:  path,
      upload_status: 'failed',
      block_reason:  upErr.message,
    })
    return { success: false, error: 'Upload mislukt. Probeer het opnieuw.' }
  }

  // 5. Log success
  await admin.from('upload_log').insert({
    user_id:       userId,
    file_name:     file.name,
    file_type:     file.type,
    file_size_bytes: file.size,
    bucket,
    storage_path:  path,
    upload_status: 'success',
  })

  // 6. Geef public URL terug (buckets zijn nog publiek — zie TAAK 7 migratie)
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)

  return { success: true, url: publicUrl, path }
}

// ─── submitReport ─────────────────────────────────────────────────────────────

export async function submitReport(
  reportedUserId: string,
  reason: ReportReason,
  description?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerSupabaseClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd.' }

  // 1. Niet zichzelf rapporteren
  if (user.id === reportedUserId) {
    return { success: false, error: 'Je kunt jezelf niet rapporteren.' }
  }

  // 2. Check dat gerapporteerde user bestaat
  const { data: reported } = await admin
    .from('profiles')
    .select('id')
    .eq('id', reportedUserId)
    .maybeSingle()

  if (!reported) return { success: false, error: 'Gebruiker niet gevonden.' }

  // 3. Rapport opslaan
  const { error: repErr } = await admin.from('reports').insert({
    reporter_id:      user.id,
    reported_user_id: reportedUserId,
    reason,
    description:      description?.trim() ?? null,
    status:           'open',
  })

  if (repErr) return { success: false, error: 'Rapport kon niet worden verzonden.' }

  // 4. Log security event
  await admin.from('security_events').insert({
    user_id:    user.id,
    event_type: 'report_submitted',
    metadata:   { reported_user_id: reportedUserId, reason },
  })

  // 5. Log in activity_log
  await admin.from('activity_log').insert({
    user_id:    user.id,
    event_type: 'report_submitted',
    metadata:   { reported_user_id: reportedUserId, reason },
  })

  return { success: true }
}

// ─── submitAvgRequest ─────────────────────────────────────────────────────────

export async function submitAvgRequest(
  requestType: AvgRequestType,
  details?: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createServerSupabaseClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd.' }

  const email = user.email
  if (!email) return { success: false, error: 'Geen e-mailadres bekend.' }

  // 1. Opslaan in avg_requests
  const { error: avgErr } = await admin.from('avg_requests').insert({
    user_id:         user.id,
    user_email:      email,
    request_type:    requestType,
    status:          'open',
    request_details: details?.trim() ?? null,
  })

  if (avgErr) return { success: false, error: 'Verzoek kon niet worden ingediend.' }

  // 2. Log security event
  await admin.from('security_events').insert({
    user_id:    user.id,
    event_type: 'avg_request',
    metadata:   { request_type: requestType },
  })

  // 3. Bevestigingsnotificatie naar gebruiker
  await admin.from('notifications').insert({
    user_id: user.id,
    type:    'system',
    title:   'AVG-verzoek ontvangen',
    body:    `Je ${requestType}-verzoek is ontvangen. We handelen dit binnen 30 dagen af.`,
  }).maybeSingle()

  return { success: true }
}

// ─── deleteAccount ────────────────────────────────────────────────────────────

export async function deleteAccount(): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createServerSupabaseClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd.' }

  const userId = user.id

  try {
    // 1. Log security event EERST (voor we data verwijderen)
    await admin.from('security_events').insert({
      user_id:    userId,
      event_type: 'account_deleted',
      metadata:   { email: user.email, deleted_at: new Date().toISOString() },
    })

    // 2. Verwijder Storage bestanden
    const buckets = ['avatars', 'banners', 'post-media', 'chat-images']
    for (const bucket of buckets) {
      const { data: files } = await admin.storage.from(bucket).list(userId)
      if (files && files.length > 0) {
        const paths = files.map(f => `${userId}/${f.name}`)
        await admin.storage.from(bucket).remove(paths)
      }
    }

    // 3. Verwijder berichten
    await admin.from('messages').delete().eq('sender_id', userId)

    // 4. Verwijder posts
    await admin.from('posts').delete().eq('user_id', userId)

    // 5. Verwijder notificaties
    await admin.from('notifications').delete().eq('user_id', userId)

    // 6. Verwijder follow_requests
    await admin.from('follow_requests')
      .delete()
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)

    // 7. Verwijder matches
    await admin.from('matches')
      .delete()
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)

    // 8. Anonimiseer profiel (soft delete — voor data-integriteit)
    await admin.from('profiles').update({
      full_name:      'Verwijderd account',
      bio:            null,
      phone:          null,
      birth_date:     null,
      avatar_url:     null,
      banner_url:     null,
      is_active:      false,
      is_searchable:  false,
      username:       `deleted_${randomUUID().substring(0, 8)}`,
    }).eq('id', userId)

    // 9. Verwijder auth account via service role
    const { error: authErr } = await admin.auth.admin.deleteUser(userId)
    if (authErr) throw new Error(authErr.message)

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error:   err instanceof Error ? err.message : 'Account verwijderen mislukt.',
    }
  }
}

// ─── exportUserData ───────────────────────────────────────────────────────────

export async function exportUserData(): Promise<
  { success: true; data: Record<string, unknown> } | { success: false; error: string }
> {
  const supabase = await createServerSupabaseClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd.' }

  const userId = user.id

  const [
    { data: profile },
    { data: posts },
    { data: messages },
    { data: matches },
    { data: followRequests },
    { data: notifications },
    { data: securityEvents },
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).single(),
    admin.from('posts').select('*').eq('user_id', userId),
    admin.from('messages').select('*').eq('sender_id', userId),
    admin.from('matches').select('*').or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
    admin.from('follow_requests').select('*').or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
    admin.from('notifications').select('*').eq('user_id', userId),
    admin.from('security_events').select('*').eq('user_id', userId),
  ])

  // Verwijder gevoelige velden uit profiel export
  const safeProfile = profile ? {
    ...profile,
    phone:      undefined,
    birth_date: undefined,
  } : null

  const exportData = {
    exported_at:    new Date().toISOString(),
    user_id:        userId,
    email:          user.email,
    profile:        safeProfile,
    posts:          posts ?? [],
    messages:       messages ?? [],
    matches:        matches ?? [],
    follow_requests: followRequests ?? [],
    notifications:  notifications ?? [],
    security_events: securityEvents ?? [],
  }

  // Log als afgehandeld AVG-verzoek
  await admin.from('avg_requests').insert({
    user_id:      userId,
    user_email:   user.email ?? '',
    request_type: 'overdracht',
    status:       'afgehandeld',
    completed_at: new Date().toISOString(),
  })

  return { success: true, data: exportData }
}

// ─── revokeAllSessions ────────────────────────────────────────────────────────

export async function revokeAllSessions(): Promise<
  { success: true } | { success: false; error: string }
> {
  const supabase = await createServerSupabaseClient()
  const admin    = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Niet ingelogd.' }

  // Uitloggen op alle andere apparaten
  const { error } = await supabase.auth.signOut({ scope: 'others' })
  if (error) return { success: false, error: 'Sessies konden niet worden ingetrokken.' }

  // Log security event
  await admin.from('security_events').insert({
    user_id:    user.id,
    event_type: 'session_revoked',
    metadata:   { scope: 'others', timestamp: new Date().toISOString() },
  })

  await admin.from('activity_log').insert({
    user_id:    user.id,
    event_type: 'sessions_revoked',
    metadata:   { scope: 'others' },
  })

  return { success: true }
}
