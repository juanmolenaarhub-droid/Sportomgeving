'use server'

import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Logt dat de gebruiker de '+' actie-knop heeft geopend.
 * Event: create_action_opened, source: feed_nav
 */
export async function logCreateActionOpened() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('activity_log').insert({
    user_id:    user.id,
    event_type: 'create_action_opened',
    metadata:   { source: 'feed_nav' },
  })
}
