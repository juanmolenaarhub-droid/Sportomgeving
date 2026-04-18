'use client'

import { Plus } from 'lucide-react'
import { Avatar } from '@/components/Avatar'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type StoryBuddy = {
  id: string
  name: string
  avatarUrl: string | null
  seen: boolean
  isLive?: boolean
}

// ─── Stories row ───────────────────────────────────────────────────────────────

export function StoriesRow({
  buddies,
  currentUserName,
  currentUserAvatarUrl,
  onAddStory,
}: {
  buddies: StoryBuddy[]
  currentUserName: string
  currentUserAvatarUrl: string | null
  onAddStory: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        overflowX: 'auto',
        padding: '4px 0 8px',
        scrollbarWidth: 'none',
      }}
    >
      {/* ── Add story knop ─────────────────────────────────────────────── */}
      <button
        onClick={onAddStory}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          {/* Dashed ring */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            border: '2px dashed rgba(26,23,20,0.28)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <Avatar name={currentUserName} imageUrl={currentUserAvatarUrl} size="lg" />
          </div>
          {/* Plus badge */}
          <div style={{
            position: 'absolute',
            bottom: 0, right: 0,
            width: 22, height: 22,
            borderRadius: '50%',
            background: '#E87722',
            border: '2px solid #F5F0E8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus style={{ width: 12, height: 12, color: 'white' }} strokeWidth={3} />
          </div>
        </div>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          fontWeight: 500,
          color: 'rgba(26,23,20,0.65)',
          maxWidth: 60,
          textAlign: 'center',
          lineHeight: 1.2,
        }}>
          Add story
        </span>
      </button>

      {/* ── Buddy stories ──────────────────────────────────────────────── */}
      {buddies.map(buddy => (
        <button
          key={buddy.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          {/* Avatar met ring */}
          <div style={{
            position: 'relative',
            width: 64, height: 64,
          }}>
            {/* Ring: solid zwart = ongezien, grijs = gezien */}
            <div style={{
              position: 'absolute', inset: 0,
              borderRadius: '50%',
              border: buddy.seen
                ? '2.5px solid rgba(26,23,20,0.18)'
                : '2.5px solid #E87722',
              overflow: 'hidden',
            }}>
              <Avatar name={buddy.name} imageUrl={buddy.avatarUrl} size="lg" />
            </div>

            {/* Live badge */}
            {buddy.isLive && (
              <div style={{
                position: 'absolute',
                bottom: 0, left: '50%',
                transform: 'translateX(-50%)',
                background: '#E87722',
                borderRadius: 999,
                padding: '2px 8px',
                border: '1.5px solid #F5F0E8',
              }}>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'white',
                }}>
                  Live
                </span>
              </div>
            )}
          </div>

          {/* Naam */}
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11,
            fontWeight: 500,
            color: '#1A1714',
            maxWidth: 60,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}>
            {buddy.name.split(' ')[0]}
          </span>
        </button>
      ))}
    </div>
  )
}
