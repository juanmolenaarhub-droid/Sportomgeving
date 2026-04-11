'use server'

import { revalidatePath } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

const ADMIN_ID = process.env.ADMIN_USER_ID

async function assertAdmin() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== ADMIN_ID) throw new Error('Geen toegang')
  return user
}

export async function updateReport(
  reportId: string,
  status: 'open' | 'in_review' | 'resolved' | 'dismissed',
  adminNote?: string,
) {
  await assertAdmin()
  const admin = createAdminClient()

  const updates: Record<string, unknown> = { status }
  if (adminNote !== undefined) updates.admin_note = adminNote
  if (status === 'resolved' || status === 'dismissed') {
    updates.resolved_at = new Date().toISOString()
    updates.resolved_by = ADMIN_ID
  }

  const { error } = await admin.from('reports').update(updates).eq('id', reportId)
  if (error) return { error: 'Update mislukt' }

  revalidatePath('/admin/issues')
  return { success: true }
}

export async function blockAccount(userId: string) {
  await assertAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ is_active: false })
    .eq('id', userId)

  if (error) return { error: 'Account blokkeren mislukt' }

  revalidatePath('/admin/issues')
  revalidatePath('/admin/gebruikers')
  return { success: true }
}

export async function unblockAccount(userId: string) {
  await assertAdmin()
  const admin = createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({ is_active: true })
    .eq('id', userId)

  if (error) return { error: 'Deblokkeren mislukt' }

  revalidatePath('/admin/issues')
  return { success: true }
}

export async function removeBlock(blockId: string) {
  await assertAdmin()
  const admin = createAdminClient()

  const { error } = await admin.from('blocked_users').delete().eq('id', blockId)
  if (error) return { error: 'Verwijderen mislukt' }

  revalidatePath('/admin/issues')
  return { success: true }
}
