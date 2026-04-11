import { createServerSupabaseClient } from '@/lib/supabase-server'
import MessagesClient, { type ConversationItem } from './_components/MessagesClient'

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const conversations: ConversationItem[] = []

  if (user) {
    // Ontvangen pending verzoeken (Verzoeken-tab)
    const { data: pendingReceived } = await supabase
      .from('follow_requests')
      .select('id, from_user_id, sport, message, created_at')
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    // Geaccepteerde matches (Inbox-tab) — beide richtingen
    const { data: acceptedSent } = await supabase
      .from('follow_requests')
      .select('id, to_user_id, sport, message, created_at')
      .eq('from_user_id', user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    const { data: acceptedReceived } = await supabase
      .from('follow_requests')
      .select('id, from_user_id, sport, message, created_at')
      .eq('to_user_id', user.id)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    // Verzamel alle andere user IDs voor profielnamen
    const otherIds = [
      ...(pendingReceived ?? []).map(r => r.from_user_id),
      ...(acceptedSent ?? []).map(r => r.to_user_id),
      ...(acceptedReceived ?? []).map(r => r.from_user_id),
    ]

    const uniqueIds = [...new Set(otherIds)]
    let profileMap: Record<string, { full_name: string | null; username: string | null }> = {}

    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', uniqueIds)

      profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
    }

    function getName(id: string) {
      const p = profileMap[id]
      return p?.full_name ?? p?.username ?? 'Onbekend'
    }

    for (const r of pendingReceived ?? []) {
      conversations.push({
        requestId: r.id,
        otherUserId: r.from_user_id,
        otherUserName: getName(r.from_user_id),
        sport: r.sport,
        message: r.message,
        createdAt: r.created_at,
        accepted: false,
      })
    }

    for (const r of acceptedSent ?? []) {
      conversations.push({
        requestId: r.id,
        otherUserId: r.to_user_id,
        otherUserName: getName(r.to_user_id),
        sport: r.sport,
        message: r.message,
        createdAt: r.created_at,
        accepted: true,
      })
    }

    for (const r of acceptedReceived ?? []) {
      conversations.push({
        requestId: r.id,
        otherUserId: r.from_user_id,
        otherUserName: getName(r.from_user_id),
        sport: r.sport,
        message: r.message,
        createdAt: r.created_at,
        accepted: true,
      })
    }
  }

  return <MessagesClient initialConversations={conversations} />
}
