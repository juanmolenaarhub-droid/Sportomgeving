'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MapPin, MessageCircle, UserCheck, UserPlus, Zap, Check, Heart, Trophy, HelpCircle } from 'lucide-react'
import { markNotificationRead } from '@/app/actions/notifications'

type Notification = {
  id: string
  type: string
  message: string
  link: string | null
  target_type: string | null
  target_id: string | null
  created_at: string
  read: boolean
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'Zojuist'
  if (mins < 60) return `${mins} min geleden`
  if (hours < 24) return `${hours} uur geleden`
  return `${days} dag${days > 1 ? 'en' : ''} geleden`
}

/**
 * Resolves a notification to the correct deep-link URL.
 * Priority: target_type+target_id > link field > type-based fallback
 */
function resolveRoute(n: Notification): string {
  // 1. target_type + target_id → specifieke deep link
  if (n.target_type && n.target_id) {
    switch (n.target_type) {
      case 'post':
        return `/dashboard/posts/${n.target_id}`
      case 'comment':
        // target_id is the post_id for comment notifications
        return `/dashboard/posts/${n.target_id}`
      case 'buddy_request':
        return '/dashboard/notifications'
      case 'meetup':
        return `/dashboard/meetup/${n.target_id}`
      case 'group':
        return `/dashboard/groups/${n.target_id}`
      case 'message':
        return `/dashboard/messages/${n.target_id}`
    }
  }

  // 2. Expliciet link-veld
  if (n.link) return n.link

  // 3. Type-gebaseerde fallback
  const t = n.type.toLowerCase()
  if (t.includes('meetup'))                              return '/dashboard/meetup'
  if (t.includes('message') || t.includes('chat'))      return '/dashboard/messages'
  if (t.includes('accepted'))                           return '/dashboard/messages'
  if (t.includes('match') || t.includes('buddy') || t.includes('request') || t.includes('follow')) return '/dashboard/notifications'
  if (t.includes('group'))                              return '/dashboard/groups'
  if (t.includes('post') || t.includes('like') || t.includes('comment')) return '/dashboard'
  return '/dashboard'
}

function NotifIcon({ type }: { type: string }) {
  const t = type.toLowerCase()
  if (t.includes('meetup'))                              return <MapPin      className="w-4 h-4 text-[#E87722]" />
  if (t.includes('message') || t.includes('chat'))      return <MessageCircle className="w-4 h-4 text-blue-500" />
  if (t.includes('accepted') || t.includes('accept'))   return <UserCheck   className="w-4 h-4 text-green-500" />
  if (t.includes('match') || t.includes('request') || t.includes('buddy')) return <UserPlus className="w-4 h-4 text-[#E87722]" />
  if (t.includes('like'))                               return <Heart       className="w-4 h-4 text-red-400" />
  if (t.includes('challenge') || t.includes('trophy'))  return <Trophy      className="w-4 h-4 text-amber-500" />
  if (t.includes('poll') || t.includes('question'))     return <HelpCircle  className="w-4 h-4 text-purple-500" />
  if (t.includes('spontaan') || t.includes('spontaneous')) return <Zap      className="w-4 h-4 text-red-500" />
  return <Bell className="w-4 h-4 text-gray-400" />
}

function iconBg(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('meetup'))                         return 'bg-orange-50'
  if (t.includes('message') || t.includes('chat')) return 'bg-blue-50'
  if (t.includes('accepted') || t.includes('accept')) return 'bg-green-50'
  if (t.includes('like'))                           return 'bg-red-50'
  if (t.includes('challenge'))                      return 'bg-amber-50'
  return 'bg-orange-50'
}

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  return (
    <div
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 pointer-events-none animate-fade-in-up"
      onAnimationEnd={() => setTimeout(onDone, 2500)}
    >
      <Bell className="w-4 h-4 text-gray-400 shrink-0" /> {msg}
    </div>
  )
}

export default function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)

  async function handleClick(n: Notification) {
    if (!n.read) await markNotificationRead(n.id)
    const route = resolveRoute(n)
    router.push(route)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl border border-black/8 flex items-center justify-center mb-4 shadow-sm">
          <Bell className="w-7 h-7 text-gray-300" />
        </div>
        <p className="font-black text-black text-base mb-1">Geen notificaties</p>
        <p className="text-sm text-gray-400">Je bent helemaal bij!</p>
      </div>
    )
  }

  return (
    <>
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        {unreadCount > 0 && (
          <div className="px-5 py-3 border-b border-black/5 flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {unreadCount} ongelezen
            </span>
            <span className="w-1.5 h-1.5 bg-[#E87722] rounded-full" />
          </div>
        )}

        <div className="divide-y divide-black/4">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className="w-full flex items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.02] group"
              style={{
                background: n.read ? 'transparent' : '#F5F0E8',
                borderLeft: n.read ? 'none' : '3px solid #E87722',
                paddingLeft: n.read ? 20 : 17,
              }}
            >
              {/* Icon */}
              <div className={`w-9 h-9 ${iconBg(n.type)} rounded-xl flex items-center justify-center shrink-0 mt-0.5`}>
                <NotifIcon type={n.type} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-snug ${n.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                  {n.message}
                </p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                {/* Deep-link label */}
                {(n.target_type || n.link) && (
                  <p className="text-[10px] font-semibold text-[#E87722] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Bekijk →
                  </p>
                )}
              </div>

              {/* Unread dot / read check */}
              <div className="shrink-0 mt-1">
                {n.read
                  ? <Check className="w-3.5 h-3.5 text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                  : <span className="w-2.5 h-2.5 bg-[#E87722] rounded-full block" />
                }
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
