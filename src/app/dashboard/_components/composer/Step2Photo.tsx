'use client'

import { useState, useRef, useCallback } from 'react'
import { ArrowLeft, ImageIcon, X, Upload } from 'lucide-react'
import { SportSelector } from '@/components/ui/SportSelector'
import { getSportById } from '@/lib/sports'
import { Avatar, getInitials } from '@/components/Avatar'
import ToggleRow from '@/components/composer/ToggleRow'
import LocationPanel from '@/components/composer/LocationPanel'
import TagPeoplePanel from '@/components/composer/TagPeoplePanel'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StepTwoResult = {
  content: string
  sport: string
  locationName: string
  locationLat: number | null
  locationLng: number | null
  music: string
  taggedUserIds: string[]
  taggedUserNames: { id: string; name: string; username: string; avatarUrl?: string }[]
  isPublic: boolean
  commentsDisabled: boolean
  likesHidden: boolean
  notShareable: boolean
  mediaFile: File | null
  thumbnailFile?: File | null
}

interface Props {
  onBack: () => void
  onSubmit: (data: StepTwoResult) => Promise<void>
  userName: string
  avatarUrl: string | null
  userId: string
}

type Phase = 'upload' | 'preview' | 'caption'

// ─── Small helpers ────────────────────────────────────────────────────────────

function PlusIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const MAX_PHOTOS = 10
const ACCEPT = 'image/*,video/mp4,video/quicktime'


function isVideo(file: File) {
  return file.type.startsWith('video/')
}

function objectUrl(file: File) {
  return URL.createObjectURL(file)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Step2Photo({ onBack, onSubmit, userName, avatarUrl, userId }: Props) {
  const [phase, setPhase] = useState<Phase>('upload')
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [fileSizeError, setFileSizeError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Caption phase state
  const [caption, setCaption] = useState('')
  const [sport, setSport] = useState('')
  const [locationName, setLocationName] = useState('')
  const [locationLat, setLocationLat] = useState<number | null>(null)
  const [locationLng, setLocationLng] = useState<number | null>(null)
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])
  const [taggedUserNames, setTaggedUserNames] = useState<
    { id: string; name: string; username: string; avatarUrl?: string }[]
  >([])
  const [isPublic, setIsPublic] = useState(true)
  const [commentsDisabled, setCommentsDisabled] = useState(false)
  const [likesHidden, setLikesHidden] = useState(false)
  const [notShareable, setNotShareable] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  // ── File handling ──

  function processFiles(incoming: FileList | File[]) {
    setFileSizeError(null)
    const arr = Array.from(incoming)

    // Check for video
    const videos = arr.filter(isVideo)
    const images = arr.filter((f) => !isVideo(f))

    let chosen: File[]
    if (videos.length > 0) {
      // Single video only
      chosen = [videos[0]]
    } else {
      // Images only – cap at MAX_PHOTOS
      const remaining = MAX_PHOTOS - files.length
      if (arr.length > remaining) {
        setFileSizeError(`Je kunt maximaal ${MAX_PHOTOS} foto's toevoegen`)
      }
      chosen = [...files, ...images.slice(0, remaining)]
      if (chosen.length > MAX_PHOTOS) chosen = chosen.slice(0, MAX_PHOTOS)
    }

    // Size check: 50MB per file
    const oversized = chosen.filter((f) => f.size > 50 * 1024 * 1024)
    if (oversized.length > 0) {
      setFileSizeError('Maximale bestandsgrootte is 50MB per bestand')
      chosen = chosen.filter((f) => f.size <= 50 * 1024 * 1024)
    }

    if (chosen.length > 0) {
      if (videos.length > 0) {
        setFiles(chosen)
      } else {
        setFiles(chosen)
      }
      setPhase('preview')
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)
      processFiles(e.dataTransfer.files)
    },
    [files], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(e.target.files)
    // Reset so same file can be re-selected
    e.target.value = ''
  }

  function removeFile(index: number) {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) setPhase('upload')
      return next
    })
  }

  function handleThumbnailInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    if (!file) return
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  async function handleShareSubmit() {
    setSubmitError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        content: caption.trim(),
        sport: getSportById(sport)?.label ?? sport,
        locationName,
        locationLat,
        locationLng,
        music: '',
        taggedUserIds,
        taggedUserNames,
        isPublic,
        commentsDisabled,
        likesHidden,
        notShareable,
        mediaFile: files[0] ?? null,
        thumbnailFile: thumbnailFile ?? null,
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Er is een fout opgetreden.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── PHASE: UPLOAD ──────────────────────────────────────────────────────────

  if (phase === 'upload') {
    return (
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ background: '#FAFAF7', fontFamily: "'Syne', sans-serif" }}
      >
        {/* Navbar */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: '#F5F2EE', background: '#FAFAF7' }}
        >
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F5F2EE] transition-colors"
          >
            <ArrowLeft size={20} color="#111" />
          </button>
          <span className="text-[15px] font-semibold text-gray-900" style={SYNE}>
            Foto / Video
          </span>
          <div className="w-9" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="w-full flex flex-col items-center justify-center gap-4 rounded-2xl transition-colors cursor-pointer"
            style={{
              border: `2px dashed ${isDragging ? '#E87722' : '#E0DDD8'}`,
              background: isDragging ? '#FFF0E5' : 'transparent',
              minHeight: 280,
              padding: '40px 24px',
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: '#F5F2EE' }}
            >
              <ImageIcon size={28} color="#9CA3AF" />
            </div>
            <div className="text-center">
              <p className="text-[14px] text-gray-500 font-medium" style={SYNE}>
                Sleep foto&#39;s en video&#39;s hierheen
              </p>
              <p className="text-[12px] text-gray-400 mt-1" style={SYNE}>
                Max {MAX_PHOTOS} foto&#39;s of 1 video · Max 50 MB per bestand
              </p>
            </div>
          </div>

          {fileSizeError && (
            <p className="text-red-500 text-[12px] mt-3 text-center">{fileSizeError}</p>
          )}

          {/* Select button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 px-6 py-2.5 rounded-full text-[14px] font-semibold border-2 transition-colors hover:bg-[#FFF0E5]"
            style={{ borderColor: '#E87722', color: '#E87722', ...SYNE }}
          >
            Selecteer van computer
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      </div>
    )
  }

  // ── PHASE: PREVIEW ─────────────────────────────────────────────────────────

  if (phase === 'preview') {
    return (
      <div
        className="flex flex-col h-full overflow-hidden"
        style={{ background: '#FAFAF7', fontFamily: "'Syne', sans-serif" }}
      >
        {/* Navbar */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: '#F5F2EE', background: '#FAFAF7' }}
        >
          <button
            onClick={() => setPhase('upload')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F5F2EE] transition-colors"
          >
            <ArrowLeft size={20} color="#111" />
          </button>
          <span className="text-[15px] font-semibold text-gray-900" style={SYNE}>
            Selectie ({files.length})
          </span>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F5F2EE] transition-colors"
          >
            <Upload size={18} color="#E87722" />
          </button>
        </div>

        {/* Thumbnail grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            {files.map((file, i) => {
              const url = objectUrl(file)
              return (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                >
                  {isVideo(file) ? (
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                    style={{ background: 'rgba(0,0,0,0.55)' }}
                  >
                    <X size={12} color="#fff" />
                  </button>
                  {i === 0 && files.length > 1 && (
                    <div
                      className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-white text-[10px] font-semibold"
                      style={{ background: 'rgba(0,0,0,0.5)', ...SYNE }}
                    >
                      Cover
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add more – only for images and if under limit */}
            {!isVideo(files[0]) && files.length < MAX_PHOTOS && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-colors hover:bg-[#F0EDE8]"
                style={{ border: '2px dashed #E0DDD8', background: '#FAFAF7' }}
              >
                <PlusIcon size={20} color="#9CA3AF" />
                <span className="text-[11px] text-gray-400" style={SYNE}>
                  Toevoegen
                </span>
              </button>
            )}
          </div>

          {fileSizeError && (
            <p className="text-red-500 text-[12px] mt-3">{fileSizeError}</p>
          )}
        </div>

        {/* Doorgaan button */}
        <div className="px-4 pb-6 flex-shrink-0">
          <button
            onClick={() => setPhase('caption')}
            className="w-full py-3.5 rounded-2xl text-white text-[15px] font-semibold transition-opacity"
            style={{ background: '#E87722', ...SYNE }}
          >
            Doorgaan
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    )
  }

  // ── PHASE: CAPTION ─────────────────────────────────────────────────────────

  const firstFile = files[0]
  const firstUrl = firstFile ? objectUrl(firstFile) : null

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{ background: '#FAFAF7', fontFamily: "'Syne', sans-serif" }}
    >
      {/* Navbar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#F5F2EE', background: '#FAFAF7' }}
      >
        <button
          onClick={() => setPhase('preview')}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#F5F2EE] transition-colors"
        >
          <ArrowLeft size={20} color="#111" />
        </button>
        <span className="text-[15px] font-semibold text-gray-900" style={SYNE}>
          Nieuw bericht
        </span>
        <button
          onClick={handleShareSubmit}
          disabled={submitting}
          className="px-4 py-1.5 rounded-full text-white text-[13px] font-semibold transition-opacity disabled:opacity-50"
          style={{ background: '#E87722', ...SYNE }}
        >
          {submitting ? 'Bezig…' : 'Delen'}
        </button>
      </div>

      {/* Error banner */}
      {submitError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100">
          <p className="text-[13px] text-red-600">{submitError}</p>
        </div>
      )}

      {/* Layout: desktop side-by-side, mobile stacked */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left: media preview */}
          <div
            className="md:w-1/2 md:flex-shrink-0 flex items-center justify-center bg-black"
            style={{ minHeight: 260 }}
          >
            {firstUrl && firstFile && (
              isVideo(firstFile) ? (
                <video
                  src={firstUrl}
                  className="max-h-[480px] w-full object-contain"
                  controls
                  muted
                  playsInline
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={firstUrl}
                  alt="Preview"
                  className="max-h-[480px] w-full object-contain"
                />
              )
            )}
          </div>

          {/* Right: caption + options */}
          <div className="flex-1 px-4 py-4 space-y-5">
            {/* User row */}
            <div className="flex items-center gap-3">
              <Avatar initials={getInitials(userName)} imageUrl={avatarUrl} size="sm" />
              <span className="text-[14px] font-semibold text-gray-900" style={SYNE}>
                {userName}
              </span>
              {files.length > 1 && (
                <span className="text-[12px] text-gray-400" style={SYNE}>
                  {files.length} bestanden
                </span>
              )}
            </div>

            {/* Caption */}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Schrijf een bijschrift…"
              rows={4}
              className="w-full bg-transparent text-[15px] text-gray-900 placeholder-gray-300 outline-none resize-none"
              style={{ caretColor: '#E87722', ...SYNE }}
            />

            <div className="border-t" style={{ borderColor: '#F5F2EE' }} />

            {/* Sport selector */}
            <div>
              <SportSelector
                value={sport}
                onChange={v => setSport(v as string)}
                multiple={false}
                label="Sport"
                placeholder="Kies een sport..."
              />
            </div>

            {/* Thumbnail — only for video files */}
            {firstFile && isVideo(firstFile) && (
              <div>
                <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                  Thumbnail (optioneel)
                </p>
                {thumbnailPreview ? (
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailPreview} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setThumbnailFile(null); setThumbnailPreview(null) }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center"
                    >
                      <X size={14} color="white" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => thumbInputRef.current?.click()}
                    className="w-full h-20 rounded-xl flex items-center justify-center gap-2 transition-colors hover:bg-[#F0EDE8]"
                    style={{ border: '2px dashed #E0DDD8', background: '#FAFAF7' }}
                  >
                    <ImageIcon size={18} color="#9CA3AF" />
                    <span className="text-[13px] text-gray-400" style={SYNE}>Kies een thumbnail afbeelding</span>
                  </button>
                )}
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailInput}
                />
              </div>
            )}

            {/* Location */}
            <div>
              <p className="text-[12px] text-gray-400 mb-2 uppercase tracking-wide" style={SYNE}>
                Locatie
              </p>
              <LocationPanel
                value={locationName}
                lat={locationLat}
                lng={locationLng}
                onChange={(name, lat, lng) => {
                  setLocationName(name)
                  setLocationLat(lat)
                  setLocationLng(lng)
                }}
                onClear={() => {
                  setLocationName('')
                  setLocationLat(null)
                  setLocationLng(null)
                }}
              />
            </div>

            {/* Tag people */}
            <TagPeoplePanel
              taggedIds={taggedUserIds}
              taggedNames={taggedUserNames}
              onAdd={(user) => {
                setTaggedUserIds((prev) => [...prev, user.id])
                setTaggedUserNames((prev) => [...prev, user])
              }}
              onRemove={(id) => {
                setTaggedUserIds((prev) => prev.filter((x) => x !== id))
                setTaggedUserNames((prev) => prev.filter((x) => x.id !== id))
              }}
              currentUserId={userId}
            />

            {/* Toggles */}
            <div
              className="rounded-2xl overflow-hidden divide-y"
              style={{ border: '1px solid #F5F2EE', background: '#fff' }}
            >
              <ToggleRow
                label="Openbaar"
                description="Zichtbaar voor iedereen"
                value={isPublic}
                onChange={setIsPublic}
              />
              <ToggleRow
                label="Reacties uitschakelen"
                value={commentsDisabled}
                onChange={setCommentsDisabled}
              />
              <ToggleRow
                label="Likes verbergen"
                value={likesHidden}
                onChange={setLikesHidden}
              />
              <ToggleRow
                label="Niet deelbaar"
                value={notShareable}
                onChange={setNotShareable}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

