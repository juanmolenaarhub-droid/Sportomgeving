'use client'

export interface AvatarProps {
  initials: string
  imageUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
  square?: boolean
  className?: string
}

const SIZE = {
  xs: { box: 'w-6 h-6',   text: 'text-[9px]',  dot: 'w-1.5 h-1.5', border: 'ring-[1.5px]' },
  sm: { box: 'w-8 h-8',   text: 'text-[11px]', dot: 'w-2 h-2',     border: 'ring-[1.5px]' },
  md: { box: 'w-10 h-10', text: 'text-[14px]', dot: 'w-2.5 h-2.5', border: 'ring-2'       },
  lg: { box: 'w-16 h-16', text: 'text-[22px]', dot: 'w-3 h-3',     border: 'ring-2'       },
  xl: { box: 'w-24 h-24', text: 'text-[32px]', dot: 'w-3.5 h-3.5', border: 'ring-[2.5px]' },
}

export function Avatar({
  initials,
  imageUrl,
  size = 'md',
  online = false,
  square = false,
  className = '',
}: AvatarProps) {
  const s = SIZE[size]
  const shape = square ? 'rounded-[6px]' : 'rounded-full'

  return (
    <div className={`relative shrink-0 ${s.box} ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={initials}
          className={`w-full h-full object-cover ${shape}`}
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center ${shape} bg-forest`}
        >
          <span className={`font-display ${s.text} uppercase tracking-wide text-lime`}>
            {initials.slice(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      {online && (
        <span
          className={`absolute bottom-0 right-0 ${s.dot} rounded-full bg-lime ${s.border} ring-bone`}
        />
      )}
    </div>
  )
}

// ─── Utility: derive initials from a display name ────────────────────────────

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}
