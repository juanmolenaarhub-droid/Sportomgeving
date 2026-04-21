import { createServerSupabaseClient } from '@/lib/supabase-server'
import NotificationsClient from './_components/NotificationsClient'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Pending buddy requests ─────────────────────────────────────────────────
  type PendingReq = {
    id: string
    from_user_id: string
    sport: string | null
    message: string | null
    created_at: string
    from_profile: { full_name: string | null; username: string | null; avatar_url: string | null } | null
  }
  let pendingRequests: PendingReq[] = []

  if (user) {
    const { data: pending } = await supabase
      .from('follow_requests')
      .select('id, from_user_id, sport, message, created_at')
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if ((pending ?? []).length > 0) {
      const fromIds = (pending ?? []).map(r => r.from_user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', fromIds)
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
      pendingRequests = (pending ?? []).map(r => ({
        ...r,
        from_profile: profileMap[r.from_user_id] ?? null,
      }))
    }
  }

  // ── System notifications ───────────────────────────────────────────────────
  type NotifRow = {
    id: string
    type: string
    message: string
    link: string | null
    target_type: string | null
    target_id: string | null
    created_at: string
    read: boolean
  }
  let notifications: NotifRow[] = []

  if (user) {
    try {
      const { data } = await supabase
        .from('system_notifications')
        .select('id, type, message, link, target_type, target_id, created_at, read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      notifications = ((data ?? []) as NotifRow[]).map(n => ({
        ...n,
        read: n.read ?? false,
        target_type: n.target_type ?? null,
        target_id: n.target_id ?? null,
      }))
    } catch {
      // graceful degradation
    }
  }

  return (
    <NotificationsClient
      notifications={notifications}
      pendingRequests={pendingRequests}
    />
  )
}
