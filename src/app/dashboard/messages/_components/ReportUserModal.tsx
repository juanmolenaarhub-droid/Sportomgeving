'use client'

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import { reportUser } from '../../safety-actions'

const REPORT_CATEGORIES = [
  'Ongepaste of beledigende berichten',
  'Intimidatie of bedreiging',
  'Spam of nep-profiel',
  'Minderjarige gebruiker',
  'Gevaarlijk of grensoverschrijdend gedrag',
  'Haatdragende of discriminerende uitingen',
  'Overig',
] as const

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const MAX_DESC = 500

type Props = {
  otherUserId: string
  otherUserName: string
  conversationId: string
  onClose: () => void
  onSubmit: (blockedAlso: boolean) => void
}

export function ReportUserModal({ otherUserId, otherUserName, conversationId, onClose, onSubmit }: Props) {
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [blockAlso, setBlockAlso] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!category) return
    setSubmitting(true)
    setError(null)
    const result = await reportUser(otherUserId, category, description, conversationId, blockAlso)
    setSubmitting(false)
    if (result.error) { setError(result.error); return }
    onSubmit(blockAlso)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(17,17,17,0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-[#F5F0E8] w-full sm:max-w-[420px] sm:rounded-[14px] rounded-t-[20px] shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-black/8 shrink-0">
          <div>
            <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 18, color: '#111' }}>
              Rapporteer {otherUserName}
            </h2>
            <p style={{ fontSize: 13 }} className="text-gray-400 mt-1 leading-relaxed">
              Je melding is anoniem. We beoordelen elk rapport zorgvuldig.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-black/8 rounded-full flex items-center justify-center hover:bg-black/12 transition-colors shrink-0 ml-3 mt-0.5"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* Rate limit / fout balk */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          )}

          {/* Categorieën */}
          <div className="space-y-2">
            {REPORT_CATEGORIES.map(cat => {
              const selected = category === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all"
                  style={{
                    backgroundColor: selected ? '#FFF8F4' : '#fff',
                    borderColor: selected ? '#E87722' : 'rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Radio cirkel */}
                  <div
                    className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
                    style={{ borderColor: selected ? '#E87722' : '#d1d5db' }}
                  >
                    {selected && (
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E87722' }} />
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-800">{cat}</span>
                </button>
              )
            })}
          </div>

          {/* Beschrijving */}
          <div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, MAX_DESC))}
              placeholder="Beschrijving (optioneel)..."
              rows={3}
              className="w-full bg-white border border-black/10 rounded-xl px-4 py-3 text-sm text-black focus:outline-none focus:ring-2 resize-none leading-relaxed"
              style={{ outline: 'none' }}
              onFocus={e => (e.target.style.boxShadow = '0 0 0 2px rgba(232,119,34,0.3)')}
              onBlur={e => (e.target.style.boxShadow = 'none')}
            />
            <div className="flex justify-end mt-1">
              <span className="text-xs text-gray-300">{description.length} / {MAX_DESC}</span>
            </div>
          </div>

          {/* Blokkeer vinkje */}
          <button
            type="button"
            onClick={() => setBlockAlso(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-black/8 text-left hover:bg-gray-50 transition-colors"
          >
            <div
              className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
              style={{
                backgroundColor: blockAlso ? '#111' : 'transparent',
                borderColor: blockAlso ? '#111' : '#d1d5db',
              }}
            >
              {blockAlso && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-sm text-gray-700">Blokkeer deze gebruiker ook</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-black/8 flex gap-3 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-black/12 text-sm font-bold text-gray-600 hover:bg-black/5 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!category || submitting}
            style={{ ...SYNE, backgroundColor: category && !submitting ? '#E87722' : undefined }}
            className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-[#E87722]"
          >
            {submitting ? 'Indienen...' : 'Rapport indienen'}
          </button>
        </div>
      </div>
    </div>
  )
}
