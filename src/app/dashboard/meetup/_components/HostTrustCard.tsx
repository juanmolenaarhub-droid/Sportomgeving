'use client'

import Link from 'next/link'
import { Star, Zap, ShieldCheck, User } from 'lucide-react'
import { Avatar, getInitials } from '@/components/Avatar'
import type { ModalCreator } from '@/app/actions/meetups'

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#E87722', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#EC4899',
  'Voetbal': '#10B981', default: '#6B7280',
}
function getSportColor(s: string) { return SPORT_COLORS[s] ?? SPORT_COLORS.default }

function calcTrustScore(creator: ModalCreator): number {
  const hosted = creator.meetupsHosted
  const rating = creator.organizerRating
  const attended = creator.meetupsAttended
  const joined = creator.meetupsJoined

  // Gehost (max 30)
  const hostedPts = hosted === 0 ? 0 : hosted <= 2 ? 10 : hosted <= 5 ? 20 : 30
  // Rating (max 30)
  const ratingPts = rating ? Math.min(30, Math.round(rating * 6)) : 0
  // Aanwezigheid % (max 20)
  const attendRate = joined > 0 ? (attended / joined) * 100 : 0
  const attendPts = Math.min(20, Math.round(attendRate * 0.2))
  // Lid-duur in maanden (max 20)
  const months = Math.floor((Date.now() - new Date(creator.createdAt).getTime()) / (30 * 24 * 3600 * 1000))
  const durationPts = Math.min(20, Math.round(months * 0.5))

  return hostedPts + ratingPts + attendPts + durationPts
}

type TrustBadge = { label: string; color: string; bg: string; icon: React.ReactNode }

function getTrustBadge(score: number): TrustBadge | null {
  if (score < 40) return null
  if (score < 60) return { label: 'Nieuw', color: '#3B82F6', bg: '#EFF6FF', icon: <User size={11} /> }
  if (score < 75) return { label: 'Actief', color: '#E87722', bg: '#FFF5EE', icon: <Zap size={11} /> }
  if (score < 90) return { label: 'Betrouwbaar', color: '#22C55E', bg: '#F0FDF4', icon: <ShieldCheck size={11} /> }
  return { label: 'Top organisator', color: '#F59E0B', bg: '#FFFBEB', icon: <Star size={11} /> }
}

type Props = { creator: ModalCreator }

export default function HostTrustCard({ creator }: Props) {
  const score = calcTrustScore(creator)
  const badge = getTrustBadge(score)
  const attendPct = creator.meetupsJoined > 0
    ? Math.round((creator.meetupsAttended / creator.meetupsJoined) * 100)
    : 0

  const bannerBg = creator.bannerUrl
    ? { backgroundImage: `url(${creator.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: `linear-gradient(135deg, ${getSportColor(creator.sport ?? '')}, #111)` }

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Banner 80px */}
      <div style={{ height: 80, position: 'relative', ...bannerBg }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.4))' }} />
        {/* Avatar gecentreerd onderaan, overlappend */}
        <div style={{ position: 'absolute', bottom: -22, left: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', border: '3px solid #F5F0E8', overflow: 'hidden', background: '#fff' }}>
            <Avatar initials={getInitials(creator.name)} imageUrl={creator.avatarUrl} size="md" />
          </div>
        </div>
      </div>

      {/* Naam + badges */}
      <div style={{ padding: '28px 14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#111', fontFamily: "'Syne', sans-serif" }}>
            {creator.name}
          </span>
          {creator.sport && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: getSportColor(creator.sport) + '18', color: getSportColor(creator.sport) }}>
              {creator.sport}
            </span>
          )}
        </div>
        {creator.city && (
          <p style={{ fontSize: 11, color: '#9ca3af', margin: '3px 0 0' }}>📍 {creator.city}</p>
        )}
        {creator.bio && (
          <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {creator.bio}
          </p>
        )}
      </div>

      {/* Rating + trust score */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          {creator.organizerRating ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700, color: '#111' }}>
              ⭐ {creator.organizerRating.toFixed(1)}/5
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>({creator.organizerReviewCount} beoordelingen)</span>
            </span>
          ) : (
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Nog geen beoordelingen</span>
          )}
        </div>

        {badge ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Betrouwbaarheidsscore</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: badge.bg, color: badge.color,
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
            }}>
              {badge.icon} {badge.label}
            </span>
          </div>
        ) : (
          <p style={{ fontSize: 11, color: '#9ca3af' }}>Te nieuw voor een score</p>
        )}
        <p style={{ fontSize: 10, color: '#9ca3af', margin: '5px 0 0', fontStyle: 'italic' }}>
          Score is gebaseerd op activiteit. Altijd je eigen oordeel gebruiken.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '8px 14px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
        {[
          { icon: '🏆', label: 'Gehost', value: creator.meetupsHosted },
          { icon: '📅', label: 'Gejoind', value: creator.meetupsJoined },
          { icon: '✅', label: 'Aanwezigheid', value: `${attendPct}%` },
        ].map(({ icon, label, value }) => (
          <div key={label} style={{ background: '#F5F0E8', borderRadius: 10, padding: '8px 10px' }}>
            <p style={{ fontSize: 10, color: '#9ca3af', margin: '0 0 2px', fontWeight: 600 }}>{icon} {label}</p>
            <p style={{ fontSize: 16, fontWeight: 900, color: '#111', margin: 0, fontFamily: "'Syne', sans-serif" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Profiel link */}
      <div style={{ padding: '10px 14px 12px' }}>
        <Link
          href={`/dashboard/profile/${creator.id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#111', color: '#fff', borderRadius: 10, padding: '9px 14px',
            textDecoration: 'none', fontSize: 13, fontWeight: 700,
          }}
        >
          Bekijk volledig profiel
          <span style={{ fontSize: 16 }}>→</span>
        </Link>
      </div>
    </div>
  )
}
