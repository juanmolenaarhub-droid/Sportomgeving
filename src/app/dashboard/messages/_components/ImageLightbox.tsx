'use client'

import { useEffect } from 'react'
import { X, Download } from 'lucide-react'

type Props = {
  src: string
  onClose: () => void
}

export function ImageLightbox({ src, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleDownload() {
    const a = document.createElement('a')
    a.href = src
    a.download = 'buddys-chat-image.jpg'
    a.target = '_blank'
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* Download button */}
      <button
        onClick={e => { e.stopPropagation(); handleDownload() }}
        className="absolute top-4 right-16 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors z-10"
      >
        <Download className="w-5 h-5 text-white" />
      </button>

      {/* Image */}
      <img
        src={src}
        alt="Chat afbeelding"
        className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}
