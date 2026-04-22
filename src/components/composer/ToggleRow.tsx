'use client'

interface ToggleRowProps {
  label: string
  description?: string
  value: boolean
  onChange: (val: boolean) => void
}

export default function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="flex flex-col">
        <span style={{ fontFamily: "'Syne', sans-serif" }} className="text-[14px] text-gray-700">
          {label}
        </span>
        {description && (
          <span className="text-[12px] text-gray-400 mt-0.5">{description}</span>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C4F542] focus-visible:ring-offset-2"
        style={{ backgroundColor: value ? '#C4F542' : '#E0DDD8' }}
      >
        <span
          className="absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200"
          style={{
            transform: value ? 'translateX(21px)' : 'translateX(3px)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  )
}
