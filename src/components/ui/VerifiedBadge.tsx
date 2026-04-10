import { Check } from 'lucide-react'

export function VerifiedBadge({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-5 h-5' : 'w-[18px] h-[18px]'
  const icon = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'
  return (
    <span
      title="Verified creator"
      className={`${dim} bg-[#E87722] rounded-full flex items-center justify-center shrink-0`}
    >
      <Check className={`${icon} text-white`} strokeWidth={3} />
    </span>
  )
}
