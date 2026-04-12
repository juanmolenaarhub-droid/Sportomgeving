import { createServerSupabaseClient } from '@/lib/supabase-server'
import MessagesClient, { type ConversationItem } from './_components/MessagesClient'

export default async function MessagesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const conversations: ConversationItem[] = []

  if (user) {
    const { data: deletedRows } = await supabase
      .from('deleted_conversations')
      .select('conversation_id')
      .eq('user_id', user.id)

    const deletedIds = new Set((deletedRows ?? []).map(r => r.conversation_id))

    const { data: pendingReceived } = await supabase
      .from('follow_requests')
      .select('id, from_user_id, sport, message, created_at')
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

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

    const otherIds = [
      ...(pendingReceived ?? []).map(r => r.from_user_id),
      ...(acceptedSent ?? []).map(r => r.to_user_id),
      ...(acceptedReceived ?? []).map(r => r.from_user_id),
    ]

    const uniqueIds = [...new Set(otherIds)]
    let profileMap: Record<string, { full_name: string | null; username: string | null; last_seen_at: string | null }> = {}

    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, last_seen_at')
        .in('id', uniqueIds)
      profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
    }

    function getName(id: string) {
      const p = profileMap[id]
      return p?.full_name ?? p?.username ?? 'Onbekend'
    }

    // Laad het laatste bericht per geaccepteerde conversatie
    const acceptedIds = [
      ...(acceptedSent ?? []).map(r => r.id),
      ...(acceptedReceived ?? []).map(r => r.id),
    ].filter(id => !deletedIds.has(id))

    const lastMsgMap: Record<string, { content: string; created_at: string; message_type: string }> = {}

    if (acceptedIds.length > 0) {
      const { data: lastMsgs } = await supabase
        .from('chat_messages')
        .select('conversation_id, content, created_at, message_type')
        .in('conversation_id', acceptedIds)
        .order('created_at', { ascending: false })
        .limit(acceptedIds.length * 10)

      for (const msg of lastMsgs ?? []) {
        if (!lastMsgMap[msg.conversation_id]) {
          lastMsgMap[msg.conversation_id] = msg
        }
      }
    }

    for (const r of pendingReceived ?? []) {
      if (deletedIds.has(r.id)) continue
      conversations.push({
        requestId: r.id,
        otherUserId: r.from_user_id,
        otherUserName: getName(r.from_user_id),
        sport: r.sport,
        message: r.message,
        createdAt: r.created_at,
        accepted: false,
        otherUserLastSeen: profileMap[r.from_user_id]?.last_seen_at ?? null,
      })
    }

    for (const r of acceptedSent ?? []) {
      if (deletedIds.has(r.id)) continue
      const last = lastMsgMap[r.id]
      conversations.push({
        requestId: r.id,
        otherUserId: r.to_user_id,
        otherUserName: getName(r.to_user_id),
        sport: r.sport,
        message: r.message,
        createdAt: last?.created_at ?? r.created_at,
        accepted: true,
        otherUserLastSeen: profileMap[r.to_user_id]?.last_seen_at ?? null,
        lastMessage: last?.content ?? null,
        lastMessageType: last?.message_type ?? null,
      })
    }

    for (const r of acceptedReceived ?? []) {
      if (deletedIds.has(r.id)) continue
      const last = lastMsgMap[r.id]
      conversations.push({
        requestId: r.id,
        otherUserId: r.from_user_id,
        otherUserName: getName(r.from_user_id),
        sport: r.sport,
        message: r.message,
        createdAt: last?.created_at ?? r.created_at,
        accepted: true,
        otherUserLastSeen: profileMap[r.from_user_id]?.last_seen_at ?? null,
        lastMessage: last?.content ?? null,
        lastMessageType: last?.message_type ?? null,
      })
    }
  }

  return <MessagesClient initialConversations={conversations} currentUserId={user?.id ?? ''} />
}
