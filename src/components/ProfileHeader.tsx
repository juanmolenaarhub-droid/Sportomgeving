'use client'

import { useRef, useState, useEffect } from 'react'
import { Camera, Pencil } from 'lucide-react'
import { Avatar, getInitials } from './Avatar'
import { validateImageFile } from '@/lib/validateFile'

type Props = {
  name: string
  bannerUrl?: string | null
  avatarUrl?: string | null
  editable?: boolean
  onBannerChange?: (file: File) => void
  onAvatarChange?: (file: File) => void
  size?: 'sm' | 'md'
}

export function ProfileHeader({
  name,
  bannerUrl,
  avatarUrl,
  editable = false,
  onBannerChange,
  onAvatarChange,
  size = 'md',
}: Props) {
  const avatarRef = useRef<HTMLInputElement>(null)

  const [bannerPreview, setBannerPreview] = useState<string | null>(bannerUrl ?? null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl ?? null)

  useEffect(() => { setBannerPreview(bannerUrl ?? null) }, [bannerUrl])
  useEffect(() => { setAvatarPreview(avatarUrl ?? null) }, [avatarUrl])

  function handleBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); return }
    setBannerPreview(URL.createObjectURL(file))
    onBannerChange?.(file)
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { alert(err); return }
    setAvatarPreview(URL.createObjectURL(file))
    onAvatarChange?.(file)
  }

  const bannerH = size === 'sm' ? 'h-28' : 'h-36'
  const avatarS = size === 'sm' ? 'w-20 h-20 -mt-10' : 'w-24 h-24 -mt-12'

  return (
    <div>
      {/* Banner */}
      <div className={`relative ${bannerH} rounded-t-2xl overflow-hidden bg-gradient-to-r from-[#111111] to-gray-700`}>
        {bannerPreview && (
          <img src={bannerPreview} alt="banner" className="absolute inset-0 w-full h-full object-cover" />
        )}

        {editable && (
          <label className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors cursor-pointer group">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 bg-black/60 text-white text-sm font-semibold px-4 py-2 rounded-xl">
              <Camera className="w-4 h-4" />
              Banner wijzigen
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleBanner} />
          </label>
        )}
      </div>

      {/* Profielfoto */}
      <div className="px-5 pb-4">
        <div className={`relative ${avatarS} mb-3`}>
          <div className={`${avatarS} rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white`}>
            {avatarPreview ? (
              <img src={avatarPreview} alt={name} className="w-full h-full object-cover" />
            ) : (
              <Avatar initials={getInitials(name)} size="lg" className="w-full h-full rounded-none" />
            )}
          </div>

          {editable && (
            <>
              <button
                onClick={() => avatarRef.current?.click()}
                className="absolute bottom-1 right-1 w-7 h-7 bg-[#111111] rounded-full flex items-center justify-center shadow-md hover:bg-[#333] transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
