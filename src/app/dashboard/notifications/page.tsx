import { Bell, UserPlus, MessageCircle, Users, Award } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { BuddyRequestCard } from './_components/BuddyRequestCard'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Zojuist'
  if (mins < 60) return `${mins} min geleden`
  if (hours < 24) return `${hours} uur geleden`
  return `${days} dag${days > 1 ? 'en' : ''} geleden`
}

export default async function NotificationsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Haal pending buddy-verzoeken op voor deze user
  let pendingRequests: {
    id: string
    from_user_id: string
    sport: string | null
    message: string | null
    created_at: string
    from_profile: { full_name: string | null; username: string | null } | null
  }[] = []

  if (user) {
    const { data } = await supabase
      .from('follow_requests')
      .select('id, from_user_id, sport, message, created_at')
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      // Haal profielnamen op
      const userIds = data.map(r => r.from_user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds)

      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

      pendingRequests = data.map(r => ({
        ...r,
        from_profile: profileMap[r.from_user_id] ?? null,
      }))
    }
  }

  const totalNew = pendingRequests.length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-black">Notificaties</h1>
          <p className="text-sm text-gray-400 mt-0.5">{totalNew} ongelezen</p>
        </div>
        <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-gray-500" />
          {totalNew > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E87722] text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {totalNew}
            </span>
          )}
        </div>
      </div>

      {/* Buddy verzoeken — live uit database */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#E87722]" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Buddy verzoeken ({pendingRequests.length})
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {pendingRequests.map(req => {
              const name = req.from_profile?.full_name ?? req.from_profile?.username ?? 'Onbekend'
              return (
                <BuddyRequestCard
                  key={req.id}
                  requestId={req.id}
                  name={name}
                  sport={req.sport}
                  message={req.message}
                  timeAgo={timeAgo(req.created_at)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Overige notificaties (UI placeholders) */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-50">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Eerder</p>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            { type: 'message', name: 'Sarah Jansen', text: 'heeft je een berichtverzoek gestuurd', time: '1 uur geleden' },
            { type: 'group', name: 'Cycling Amsterdam', text: 'heeft je uitgenodigd voor de groep', time: '3 uur geleden' },
            { type: 'like', name: 'Marco de Wit', text: 'vindt je post leuk', time: 'Gisteren' },
            { type: 'follow', name: 'Lisa Hoek', text: 'volgt jou nu', time: '2 dagen geleden' },
          ].map((n, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="relative">
                <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">
                  {n.name[0]}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                  {n.type === 'message' && <MessageCircle className="w-3 h-3 text-blue-500" />}
                  {n.type === 'group' && <Users className="w-3 h-3 text-green-500" />}
                  {n.type === 'like' && <Award className="w-3 h-3 text-pink-500" />}
                  {n.type === 'follow' && <UserPlus className="w-3 h-3 text-[#E87722]" />}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <span className="font-bold text-black">{n.name}</span> {n.text}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {pendingRequests.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-4">Geen nieuwe buddy-verzoeken.</p>
      )}
    </div>
  )
}
