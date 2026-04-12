'use client'

const SPORT_COLORS: Record<string, string> = {
  'Hardlopen': '#E87722', 'Fietsen': '#3B82F6', 'Zwemmen': '#06B6D4',
  'Gym': '#22C55E', 'Tennis': '#8B5CF6', 'Padel': '#EC4899',
  'Voetbal': '#10B981', default: '#111111',
}
const SPORT_EMOJIS: Record<string, string> = {
  'Hardlopen': '🏃', 'Fietsen': '🚴', 'Zwemmen': '🏊', 'Gym': '💪',
  'Tennis': '🎾', 'Padel': '🏸', 'Voetbal': '⚽', 'Yoga': '🧘',
  'Wandelen': '🚶', 'Golf': '⛳', 'Boksen': '🥊', 'Klimmen': '🧗',
  default: '🏅',
}

export function getSportColor(s: string): string {
  return SPORT_COLORS[s] ?? SPORT_COLORS.default
}
export function getSportEmoji(s: string): string {
  return SPORT_EMOJIS[s] ?? SPORT_EMOJIS.default
}

type Props = {
  sport: string
  isSpontaneous: boolean
  isSelected: boolean
  onClick: () => void
}

export default function MeetupMapPin({ sport, isSpontaneous, isSelected, onClick }: Props) {
  const color = getSportColor(sport)
  const emoji = getSportEmoji(sport)

  return (
    <>
      {isSpontaneous && (
        <style>{`
          @keyframes pin-ring {
            0%   { transform: translate(-50%, -50%) scale(1);   opacity: 0.7; }
            70%  { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1);   opacity: 0; }
          }
        `}</style>
      )}

      <div
        onClick={onClick}
        style={{
          position: 'relative',
          width: 40,
          height: 50,
          cursor: 'pointer',
          transform: isSelected ? 'scale(1.18) translateY(-4px)' : 'scale(1)',
          transition: 'transform 0.18s cubic-bezier(.34,1.56,.64,1)',
          filter: isSelected
            ? `drop-shadow(0 0 8px ${color}88) drop-shadow(0 3px 6px rgba(0,0,0,0.35))`
            : 'drop-shadow(0 2px 5px rgba(0,0,0,0.28))',
        }}
      >
        {/* Pulserende ring voor spontane meetups */}
        {isSpontaneous && (
          <div style={{
            position: 'absolute',
            top: '35%',
            left: '50%',
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: color,
            animation: 'pin-ring 2s ease-out infinite',
          }} />
        )}

        {/* Witte geselecteerde ring */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            top: -5,
            left: -5,
            right: -5,
            bottom: 5,
            borderRadius: '50% 50% 50% 0',
            border: '2.5px solid white',
            pointerEvents: 'none',
          }} />
        )}

        {/* SVG locatie-pin (teardrop) */}
        <svg
          width="40"
          height="50"
          viewBox="0 0 40 50"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block' }}
        >
          {/* Schaduw */}
          <ellipse cx="20" cy="47" rx="7" ry="2.5" fill="rgba(0,0,0,0.18)" />
          {/* Pin vorm */}
          <path
            d="M20 1C10.6 1 3 8.6 3 18C3 28.5 14 39 18.4 43.8C19.3 44.8 20.7 44.8 21.6 43.8C26 39 37 28.5 37 18C37 8.6 29.4 1 20 1Z"
            fill={color}
          />
          {/* Witte cirkel binnenin */}
          <circle cx="20" cy="18" r="9.5" fill="white" opacity="0.96" />
        </svg>

        {/* Emoji in de pin */}
        <div style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 12,
          lineHeight: '20px',
          textAlign: 'center',
          userSelect: 'none',
          pointerEvents: 'none',
        }}>
          {emoji}
        </div>
      </div>
    </>
  )
}
