import { Bell, UserPlus, MessageCircle, Check } from 'lucide-react'
import Link from 'next/link'
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

  type PendingReq = {
    id: string; from_user_id: string; sport: string | null
    message: string | null; created_at: string
    from_profile: { full_name: string | null; username: string | null; avatar_url: string | null } | null
  }
  type AcceptedNotif = {
    id: string; to_user_id: string; sport: string | null; accepted_at: string | null
    to_profile: { full_name: string | null; username: string | null; avatar_url: string | null } | null
  }
  type MsgNotif = {
    id: string; sender_id: string; content: string; created_at: string; message_type: string
    conversation_id: string
    sender: { full_name: string | null; username: string | null; avatar_url: string | null } | null
  }

  let pendingRequests: PendingReq[] = []
  let acceptedNotifs: AcceptedNotif[] = []
  let recentMessages: MsgNotif[] = []

  if (user) {
    // 1. Openstaande buddy-verzoeken (anderen → ik)
    const { data: pending } = await supabase
      .from('follow_requests')
      .select('id, from_user_id, sport, message, created_at')
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    // 2. Verzoeken die recent zijn geaccepteerd (ik → anderen, accepted afgelopen 7 dagen)
    const since7d = new Date(Date.now() - 7 * 86400000).toISOString()
    const { data: accepted } = await supabase
      .from('follow_requests')
      .select('id, to_user_id, sport, accepted_at')
      .eq('from_user_id', user.id)
      .eq('status', 'accepted')
      .gte('accepted_at', since7d)
      .order('accepted_at', { ascending: false })

    // 3. Laatste berichten ontvangen in mijn conversaties (niet van mij, afgelopen 24u)
    const since24h = new Date(Date.now() - 86400000).toISOString()
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('id, sender_id, content, created_at, message_type, conversation_id')
      .neq('sender_id', user.id)
      .is('read_at', null)
      .gte('created_at', since24h)
      .order('created_at', { ascending: false })
      .limit(10)

    // Haal profielen op
    const allIds = [
      ...(pending ?? []).map(r => r.from_user_id),
      ...(accepted ?? []).map(r => r.to_user_id),
      ...(msgs ?? []).map(m => m.sender_id),
    ]
    const uniqueIds = [...new Set(allIds)]

    let profileMap: Record<string, { full_name: string | null; username: string | null; avatar_url: string | null }> = {}
    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', uniqueIds)
      profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
    }

    // Filter berichten: alleen van geaccepteerde buddy-conversaties
    const acceptedConvIds = new Set([
      ...(accepted ?? []).map(r => r.id),
    ])
    // Haal ook conversaties op waarbij ik de ontvanger ben
    const { data: myAcceptedReceived } = await supabase
      .from('follow_requests')
      .select('id')
      .eq('to_user_id', user.id)
      .eq('status', 'accepted')
    for (const r of myAcceptedReceived ?? []) acceptedConvIds.add(r.id)

    pendingRequests = (pending ?? []).map(r => ({
      ...r, from_profile: profileMap[r.from_user_id] ?? null,
    }))
    acceptedNotifs = (accepted ?? []).map(r => ({
      ...r, to_profile: profileMap[r.to_user_id] ?? null,
    }))
    recentMessages = (msgs ?? [])
      .filter(m => acceptedConvIds.has(m.conversation_id))
      .map(m => ({ ...m, sender: profileMap[m.sender_id] ?? null }))
  }

  const totalNew = pendingRequests.length + recentMessages.length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-black">Notificaties</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalNew > 0 ? `${totalNew} nieuw` : 'Alles bijgewerkt'}
          </p>
        </div>
        <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-gray-500" />
          {totalNew > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E87722] text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {totalNew > 9 ? '9+' : totalNew}
            </span>
          )}
        </div>
      </div>

      {/* Openstaande buddy-verzoeken */}
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

      {/* Ongelezen berichten */}
      {recentMessages.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Nieuwe berichten ({recentMessages.length})
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {recentMessages.map(msg => {
              const name = msg.sender?.full_name ?? msg.sender?.username ?? 'Onbekend'
              const preview = msg.message_type === 'image' ? '📷 Afbeelding' : msg.message_type === 'appointment' ? '📅 Afspraak' : msg.content.slice(0, 60)
              return (
                <Link
                  key={msg.id}
                  href="/dashboard/messages"
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 shrink-0">
                    {name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-black">{name}</p>
                    <p className="text-xs text-gray-500 truncate">{preview}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{timeAgo(msg.created_at)}</p>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Geaccepteerde verzoeken (recente 7 dagen) */}
      {acceptedNotifs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Buddy verzoeken geaccepteerd
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {acceptedNotifs.map(r => {
              const name = r.to_profile?.full_name ?? r.to_profile?.username ?? 'Onbekend'
              return (
                <Link
                  key={r.id}
                  href="/dashboard/messages"
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600 shrink-0">
                    {name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-bold text-black">{name}</span> heeft je buddy-verzoek geaccepteerd
                      {r.sport && <span className="text-[#E87722] font-semibold"> · {r.sport}</span>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.accepted_at ? timeAgo(r.accepted_at) : ''}</p>
                  </div>
                  <span className="text-xs font-bold text-[#E87722] bg-orange-50 px-2 py-1 rounded-lg shrink-0">Chat →</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {totalNew === 0 && acceptedNotifs.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Bell className="w-10 h-10 text-gray-200 mx-auto mb-4" />
          <p className="font-black text-black mb-1">Geen nieuwe notificaties</p>
          <p className="text-sm text-gray-400">We laten je weten als er iets nieuws is.</p>
        </div>
      )}
    </div>
  )
}
