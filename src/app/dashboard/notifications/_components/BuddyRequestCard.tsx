'use client'

import { useState, useTransition } from 'react'
import { Check, X, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { StoryAvatar } from '@/components/StoryAvatar'
import { acceptBuddyRequest, declineBuddyRequest } from '../../actions'

type Props = {
  requestId: string
  fromUserId: string
  name: string
  sport: string | null
  message: string | null
  timeAgo: string
}

export function BuddyRequestCard({ requestId, fromUserId, name, sport, message, timeAgo }: Props) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null)

  function handleAccept() {
    startTransition(async () => {
      await acceptBuddyRequest(requestId)
      setDone('accepted')
    })
  }

  function handleDecline() {
    startTransition(async () => {
      await declineBuddyRequest(requestId)
      setDone('declined')
    })
  }

  if (done === 'accepted') {
    return (
      <div className="flex items-center gap-4 px-5 py-4 bg-green-50">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-green-700 font-semibold">Je bent nu buddies met {name}!</p>
        </div>
        <Link
          href={`/dashboard/messages`}
          className="flex items-center gap-1.5 bg-[#111] text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-[#C4F542] transition-colors shrink-0"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Chat
        </Link>
      </div>
    )
  }

  if (done === 'declined') {
    return (
      <div className="flex items-center gap-4 px-5 py-4 bg-gray-50">
        <p className="text-sm text-gray-400">Verzoek van {name} geweigerd.</p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-4 px-5 py-4 bg-orange-50/30 hover:bg-orange-50/50 transition-colors">
      <Link href={`/dashboard/profile/${fromUserId}`} className="relative shrink-0">
        <StoryAvatar name={name} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">
          <Link href={`/dashboard/profile/${fromUserId}`} className="font-bold text-black hover:text-[#C4F542] transition-colors">{name}</Link>
          {' '}wil jouw sportbuddy worden
          {sport && <span className="text-[#C4F542] font-semibold"> · {sport}</span>}
        </p>
        {message && (
          <p className="text-xs text-gray-500 mt-1 bg-white rounded-lg px-3 py-2 border border-gray-100 italic">
            &ldquo;{message}&rdquo;
          </p>
        )}
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAccept}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-[#1E2B20] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#C4F542] transition-colors disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Accepteer
          </button>
          <button
            onClick={handleDecline}
            disabled={isPending}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Weigeren
          </button>
        </div>
      </div>
      <div className="w-2 h-2 bg-[#C4F542] rounded-full shrink-0 mt-2" />
    </div>
  )
}
