const COLORS = [
  'bg-orange-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-red-500',
]

function colorFromName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function initials(name: string) {
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

const sizeMap = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-11 h-11 text-sm',
  lg: 'w-16 h-16 text-lg',
}

export function Avatar({
  name,
  imageUrl,
  size = 'md',
  className = '',
}: {
  name: string
  imageUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}) {
  const s = sizeMap[size]
  if (imageUrl) {
    return (
      <div className={`${s} rounded-full overflow-hidden shrink-0 ${className}`}>
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    )
  }
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-bold text-white shrink-0 ${colorFromName(name)} ${className}`}>
      {initials(name)}
    </div>
  )
}
