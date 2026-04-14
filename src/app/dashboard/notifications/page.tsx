import { Bell } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { BuddyRequestCard } from './_components/BuddyRequestCard'
import NotificationsClient from './_components/NotificationsClient'

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Openstaande buddy-verzoeken (altijd bovenaan, actie vereist) ────────────
  type PendingReq = {
    id: string; from_user_id: string; sport: string | null
    message: string | null; created_at: string
  }
  let pendingRequests: (PendingReq & { from_profile: { full_name: string | null; username: string | null; avatar_url: string | null } | null })[] = []

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

  // ── Chronologische feed uit system_notifications ───────────────────────────
  type NotifRow = {
    id: string
    type: string
    message: string
    link: string | null
    created_at: string
    read: boolean
  }
  let notifications: NotifRow[] = []

  if (user) {
    try {
      const { data } = await supabase
        .from('system_notifications')
        .select('id, type, message, link, created_at, read')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      notifications = ((data ?? []) as NotifRow[]).map(n => ({
        ...n,
        read: n.read ?? false,
      }))
    } catch {
      // Tabel of kolom bestaat nog niet — graceful degradation
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length + pendingRequests.length

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 24, color: '#111' }}>
            Notificaties
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} nieuw` : 'Je bent helemaal bij'}
          </p>
        </div>
        <div className="relative w-11 h-11 bg-white border border-black/8 rounded-xl flex items-center justify-center shadow-sm">
          <Bell className="w-5 h-5 text-gray-500" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#E87722] text-white text-[10px] font-black rounded-full flex items-center justify-center px-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Buddy-verzoeken (met accept/decline knoppen) */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="px-5 py-3 border-b border-black/5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Buddy verzoeken ({pendingRequests.length})
            </p>
          </div>
          <div className="divide-y divide-black/4">
            {pendingRequests.map(req => (
              <BuddyRequestCard
                key={req.id}
                requestId={req.id}
                fromUserId={req.from_user_id}
                name={req.from_profile?.full_name ?? req.from_profile?.username ?? 'Onbekend'}
                sport={req.sport}
                message={req.message}
                timeAgo={(() => {
                  const diff = Date.now() - new Date(req.created_at).getTime()
                  const mins = Math.floor(diff / 60000)
                  const hours = Math.floor(diff / 3600000)
                  if (mins < 1) return 'Zojuist'
                  if (mins < 60) return `${mins} min geleden`
                  if (hours < 24) return `${hours} uur geleden`
                  return `${Math.floor(diff / 86400000)} dag geleden`
                })()}
              />
            ))}
          </div>
        </div>
      )}

      {/* Chronologische notificatie-feed */}
      <NotificationsClient notifications={notifications} />

      {/* SQL migration hint (dev only) */}
      {/* Run: ALTER TABLE system_notifications ADD COLUMN IF NOT EXISTS read boolean DEFAULT false; */}
    </div>
  )
}
