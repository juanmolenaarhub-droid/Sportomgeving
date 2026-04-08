'use client'

import { Bell, UserPlus, MessageCircle, Users, Award } from 'lucide-react'
import { StoryAvatar } from '@/components/StoryAvatar'

const notifications = [
  { id: 1, type: 'follow', name: 'Tim van Berg', text: 'volgt jou nu', time: '5 min geleden', read: false },
  { id: 2, type: 'message', name: 'Sarah Jansen', text: 'heeft je een berichtverzoek gestuurd', time: '1 uur geleden', read: false },
  { id: 3, type: 'group', name: 'Cycling Amsterdam', text: 'heeft je uitgenodigd voor de groep', time: '3 uur geleden', read: false },
  { id: 4, type: 'like', name: 'Marco de Wit', text: 'vindt je post leuk', time: 'Gisteren', read: true },
  { id: 5, type: 'follow', name: 'Lisa Hoek', text: 'volgt jou nu', time: '2 dagen geleden', read: true },
  { id: 6, type: 'message', name: 'Kevin Smit', text: 'heeft je een berichtverzoek gestuurd', time: '3 dagen geleden', read: true },
]

const iconMap: Record<string, React.ReactNode> = {
  follow: <UserPlus className="w-4 h-4 text-[#E87722]" />,
  message: <MessageCircle className="w-4 h-4 text-blue-500" />,
  group: <Users className="w-4 h-4 text-green-500" />,
  like: <Award className="w-4 h-4 text-pink-500" />,
}

export default function NotificationsPage() {
  const unread = notifications.filter(n => !n.read)
  const read = notifications.filter(n => n.read)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-black">Notificaties</h1>
          <p className="text-sm text-gray-400 mt-0.5">{unread.length} ongelezen</p>
        </div>
        <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center relative">
          <Bell className="w-5 h-5 text-gray-500" />
          {unread.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#E87722] text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {unread.length}
            </span>
          )}
        </div>
      </div>

      {/* Ongelezen */}
      {unread.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nieuw</p>
          </div>
          <div className="divide-y divide-gray-50">
            {unread.map(n => (
              <div key={n.id} className="flex items-center gap-4 px-5 py-4 bg-orange-50/30 hover:bg-orange-50/60 transition-colors cursor-pointer">
                <div className="relative">
                  <StoryAvatar name={n.name} size="sm" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                    {iconMap[n.type]}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-bold text-black">{n.name}</span> {n.text}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                </div>
                <div className="w-2 h-2 bg-[#E87722] rounded-full shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gelezen */}
      {read.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Eerder</p>
          </div>
          <div className="divide-y divide-gray-50">
            {read.map(n => (
              <div key={n.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="relative">
                  <StoryAvatar name={n.name} size="sm" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                    {iconMap[n.type]}
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
      )}
    </div>
  )
}
