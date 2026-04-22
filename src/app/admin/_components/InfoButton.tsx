'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type Props = {
  title: string
  body: string
}

export function InfoButton({ title, body }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  return (
    <div className="relative inline-flex items-center" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-5 h-5 rounded-full bg-black/6 hover:bg-[#C4F542]/15 flex items-center justify-center transition-colors"
        aria-label="Meer informatie"
      >
        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-7 z-50 w-80 bg-white rounded-2xl border border-black/10 shadow-2xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p style={{ ...SYNE, fontWeight: 700, fontSize: 13, color: '#1E2B20' }}>{title}</p>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-300 hover:text-gray-500 shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{body}</p>
        </div>
      )}
    </div>
  )
}
