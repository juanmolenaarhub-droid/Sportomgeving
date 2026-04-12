'use client'

import { useRouter } from 'next/navigation'
import { Bell, MapPin, MessageCircle, UserCheck, UserPlus, Zap, Check } from 'lucide-react'
import { markNotificationRead } from '@/app/actions/notifications'

type Notification = {
  id: string
  type: string
  message: string
  link: string | null
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

function getRoute(type: string, link: string | null): string {
  if (link) return link
  if (type.includes('meetup')) return '/dashboard/meetup'
  if (type.includes('message') || type.includes('chat')) return '/dashboard/messages'
  if (type.includes('match') || type.includes('buddy') || type.includes('follow')) return '/dashboard/notifications'
  return '/dashboard'
}

function NotifIcon({ type }: { type: string }) {
  if (type.includes('meetup')) return <MapPin className="w-4 h-4 text-[#E87722]" />
  if (type.includes('message') || type.includes('chat')) return <MessageCircle className="w-4 h-4 text-blue-500" />
  if (type.includes('accepted') || type.includes('accept')) return <UserCheck className="w-4 h-4 text-green-500" />
  if (type.includes('match') || type.includes('request') || type.includes('buddy')) return <UserPlus className="w-4 h-4 text-[#E87722]" />
  if (type.includes('spontaan') || type.includes('spontaneous')) return <Zap className="w-4 h-4 text-red-500" />
  return <Bell className="w-4 h-4 text-gray-400" />
}

function iconBg(type: string): string {
  if (type.includes('meetup'))    return 'bg-orange-50'
  if (type.includes('message') || type.includes('chat')) return 'bg-blue-50'
  if (type.includes('accepted') || type.includes('accept')) return 'bg-green-50'
  return 'bg-orange-50'
}

export default function NotificationsClient({ notifications }: { notifications: Notification[] }) {
  const router = useRouter()

  async function handleClick(n: Notification) {
    if (!n.read) await markNotificationRead(n.id)
    router.push(getRoute(n.type, n.link))
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
  )
}
