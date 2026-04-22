'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toggleReaction } from '../../chat-actions'

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '🔥', '💪', '🎯']

export type Reaction = {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

type Props = {
  messageId: string
  reactions: Reaction[]
  currentUserId: string
  fromMe: boolean
  onReactionChange: (messageId: string, reactions: Reaction[]) => void
}

export function MessageReactions({ messageId, reactions, currentUserId, fromMe, onReactionChange }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const [pending, setPending] = useState<string | null>(null)

  // Group reactions by emoji
  const grouped = reactions.reduce<Record<string, { count: number; myReaction: boolean; reactionId: string | null }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, myReaction: false, reactionId: null }
    acc[r.emoji].count++
    if (r.user_id === currentUserId) { acc[r.emoji].myReaction = true; acc[r.emoji].reactionId = r.id }
    return acc
  }, {})

  async function handleToggle(emoji: string) {
    if (pending) return
    setPending(emoji)
    setShowPicker(false)
    const result = await toggleReaction(messageId, emoji)
    setPending(null)
    if (result.reactions) {
      onReactionChange(messageId, result.reactions as Reaction[])
    }
  }

  const hasReactions = Object.keys(grouped).length > 0

  return (
    <div className={`flex items-center gap-1 mt-1 ${fromMe ? 'justify-end' : 'justify-start'}`}>
      {/* Existing reaction badges */}
      {Object.entries(grouped).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => handleToggle(emoji)}
          disabled={!!pending}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border ${
            data.myReaction
              ? 'bg-[#C4F542]/15 border-[#C4F542]/40 text-[#C4F542]'
              : 'bg-white border-black/10 text-gray-600 hover:border-[#C4F542]/40'
          } disabled:opacity-60`}
        >
          <span>{emoji}</span>
          {data.count > 1 && <span className="font-bold text-[10px]">{data.count}</span>}
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(v => !v)}
          className={`w-6 h-6 rounded-full border border-black/10 bg-white flex items-center justify-center hover:border-[#C4F542]/40 hover:text-[#C4F542] transition-all text-gray-400 ${hasReactions ? '' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <Plus className="w-3 h-3" />
        </button>

        {showPicker && (
          <div
            className={`absolute bottom-8 z-30 bg-white rounded-2xl shadow-xl border border-black/8 p-2 flex gap-1 ${
              fromMe ? 'right-0' : 'left-0'
            }`}
          >
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleToggle(emoji)}
                disabled={!!pending}
                className="text-lg w-9 h-9 rounded-xl hover:bg-[#F4F1E8] transition-colors flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
