'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function markNotificationRead(id: string) {
  try {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('system_notifications')
      .update({ read: true })
      .eq('id', id)
  } catch {
    // Graceful: if `read` column doesn't exist yet, just ignore
  }
}
