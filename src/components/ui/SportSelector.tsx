'use client'

import {
  useState, useRef, useEffect, useCallback, useId,
} from 'react'
import { Check, ChevronDown, X, Search, Plus } from 'lucide-react'
import {
  SPORTS, POPULAR_SPORTS, CATEGORY_LABELS, getSportById,
  type SportCategory,
} from '@/lib/sports'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SportSelectorProps {
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  maxSelections?: number
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_ORDER: SportCategory[] = [
  'hardlopen_fietsen',
  'zwemmen_watersport',
  'teamsporten',
  'racketsporten',
  'vechtsporten',
  'fitness_gym',
  'outdoor_natuur',
  'paardensport',
  'wintersport',
  'precisie_schieten',
  'avontuur_lucht',
  'overig',
]

/** Returns label for any value — including custom free-text */
function displayForValue(id: string): { label: string } {
  const known = getSportById(id)
  return { label: known?.label ?? id }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SportSelector({
  value,
  onChange,
  multiple = false,
  placeholder = 'Zoek of kies een sport...',
  label,
  error,
  disabled = false,
  maxSelections,
  className = '',
}: SportSelectorProps) {
  const [open,         setOpen]        = useState(false)
  const [query,        setQuery]       = useState('')
  const [focusedIdx,   setFocusedIdx]  = useState(-1)
  const [customInput,  setCustomInput] = useState('')

  const containerRef  = useRef<HTMLDivElement>(null)
  const searchRef     = useRef<HTMLInputElement>(null)
  const customRef     = useRef<HTMLInputElement>(null)
  const listRef       = useRef<HTMLDivElement>(null)
  const labelId       = useId()
  const listboxId     = useId()

  // Normalised selection as an array of IDs / free-text values
  const selected: string[] = multiple
    ? (value as string[])
    : (value as string) ? [value as string] : []

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Auto-focus search when opening ───────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0)
      setFocusedIdx(-1)
    }
  }, [open])

  // ── Filtered + grouped sport list ─────────────────────────────────────────
  const filteredSports = query.trim()
    ? SPORTS.filter(s => s.label.toLowerCase().includes(query.trim().toLowerCase()))
    : null  // null means "show grouped + popular"

  // ── Select / deselect known sport ─────────────────────────────────────────
  const toggle = useCallback((id: string) => {
    if (multiple) {
      const arr = value as string[]
      if (arr.includes(id)) {
        onChange(arr.filter(v => v !== id))
      } else {
        if (maxSelections && arr.length >= maxSelections) return
        onChange([...arr, id])
      }
    } else {
      onChange(id === (value as string) ? '' : id)
      setOpen(false)
      setQuery('')
    }
  }, [multiple, value, onChange, maxSelections])

  // ── Submit custom "anders" sport ──────────────────────────────────────────
  const handleCustomSubmit = useCallback(() => {
    const trimmed = customInput.trim()
    if (!trimmed) return
    if (multiple) {
      const arr = value as string[]
      if (arr.includes(trimmed)) { setCustomInput(''); return }
      if (maxSelections && arr.length >= maxSelections) return
      onChange([...arr, trimmed])
    } else {
      onChange(trimmed)
      setOpen(false)
      setQuery('')
    }
    setCustomInput('')
  }, [customInput, multiple, value, onChange, maxSelections])

  // ── Flat list of visible sports (for keyboard navigation) ────────────────
  const flatList = filteredSports ?? SPORTS

  // ── Keyboard navigation in search bar ────────────────────────────────────
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); return }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, flatList.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      e.preventDefault()
      const sport = flatList[focusedIdx]
      if (sport) toggle(sport.id)
    }
  }

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIdx < 0 || !listRef.current) return
    const items = listRef.current.querySelectorAll('[role="option"]')
    items[focusedIdx]?.scrollIntoView({ block: 'nearest' })
  }, [focusedIdx])

  // ── Display for the trigger button (single mode) ──────────────────────────
  const singleDisplay = !multiple && (value as string)
    ? displayForValue(value as string)
    : null

  // ── Max reached ──────────────────────────────────────────────────────────
  const maxReached = multiple && maxSelections != null && (value as string[]).length >= maxSelections

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label id={labelId} className="block text-xs font-bold text-gray-600 mb-1.5">
          {label}
        </label>
      )}

      {/* Multi: selected pills */}
      {multiple && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(id => {
            const d = displayForValue(id)
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 bg-[#111111] text-white text-xs px-2.5 py-1 rounded-full"
              >
                <span className="font-semibold">{d.label}</span>
                {!disabled && (
                  <button
                    type="button"
                    aria-label={`Verwijder ${d.label}`}
                    onClick={() => toggle(id)}
                    className="ml-0.5 hover:text-gray-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            )
          })}
        </div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? labelId : undefined}
        aria-controls={listboxId}
        onClick={() => !disabled && setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm border rounded-lg bg-white transition-all text-left ${
          open
            ? 'border-[#E87722] ring-2 ring-[#E87722]/20'
            : error
            ? 'border-red-400'
            : 'border-[#111111]/20 hover:border-[#111111]/40'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={singleDisplay ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {singleDisplay
            ? singleDisplay.label
            : multiple
            ? (selected.length === 0 ? placeholder : `${selected.length} sport${selected.length !== 1 ? 'en' : ''} gekozen`)
            : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
      )}

      {/* Dropdown */}
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-multiselectable={multiple}
          aria-labelledby={label ? labelId : undefined}
          className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-[#111111]/10 rounded-xl shadow-lg overflow-hidden"
          style={{ maxHeight: 380 }}
        >
          {/* Search bar */}
          <div className="p-2 border-b border-[#111111]/8">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setFocusedIdx(-1) }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Zoek sport..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 rounded-lg border-none outline-none placeholder:text-gray-400"
                aria-label="Zoek een sport"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); setFocusedIdx(-1) }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Scrollable list */}
          <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: 256 }}>
            {filteredSports ? (
              // ── Search results ────────────────────────────────────────────
              filteredSports.length === 0 ? (
                <p className="px-4 py-4 text-sm text-gray-400 text-center">
                  Geen sporten gevonden — gebruik &quot;Anders&quot; hieronder
                </p>
              ) : (
                filteredSports.map((sport, i) => {
                  const isSelected    = selected.includes(sport.id)
                  const isFocused     = i === focusedIdx
                  const isDisabledItem = !isSelected && maxReached
                  return (
                    <SportRow
                      key={sport.id}
                      emoji=""
                      label={sport.label}
                      selected={isSelected}
                      focused={isFocused}
                      disabled={isDisabledItem}
                      multiple={multiple}
                      onClick={() => !isDisabledItem && toggle(sport.id)}
                    />
                  )
                })
              )
            ) : (
              // ── Grouped browse ────────────────────────────────────────────
              <>
                {/* Popular chips */}
                <div>
                  <p className="text-xs font-semibold text-[#111111]/40 uppercase tracking-wider px-3 py-1.5 bg-gray-50">
                    Populair
                  </p>
                  <div className="px-3 py-2 flex flex-wrap gap-1.5">
                    {POPULAR_SPORTS.map(sport => {
                      const isSelected    = selected.includes(sport.id)
                      const isDisabledItem = !isSelected && maxReached
                      return (
                        <button
                          key={sport.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          disabled={isDisabledItem}
                          onClick={() => !isDisabledItem && toggle(sport.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-[#E87722] text-white border-[#E87722]'
                              : isDisabledItem
                              ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-[#E87722] hover:text-[#E87722]'
                          }`}
                        >
                          <span>{sport.label}</span>
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Grouped by category */}
                {CATEGORY_ORDER.map(cat => {
                  const catSports = SPORTS.filter(s => s.category === cat)
                  if (catSports.length === 0) return null
                  return (
                    <div key={cat}>
                      <p className="text-xs font-semibold text-[#111111]/40 uppercase tracking-wider px-3 py-1.5 bg-gray-50">
                        {CATEGORY_LABELS[cat]}
                      </p>
                      {catSports.map(sport => {
                        const isSelected    = selected.includes(sport.id)
                        const isFocused     = flatList.indexOf(sport) === focusedIdx
                        const isDisabledItem = !isSelected && maxReached
                        return (
                          <SportRow
                            key={sport.id}
                            emoji=""
                            label={sport.label}
                            selected={isSelected}
                            focused={isFocused}
                            disabled={isDisabledItem}
                            multiple={multiple}
                            onClick={() => !isDisabledItem && toggle(sport.id)}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </>
            )}
          </div>

          {/* ── Anders / eigen sport ─────────────────────────────────────── */}
          <div className="px-3 py-2.5 border-t border-[#111111]/8 bg-gray-50">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              Staat jouw sport er niet bij?
            </p>
            <div className="flex gap-2">
              <input
                ref={customRef}
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); handleCustomSubmit() }
                  if (e.key === 'Escape') { setOpen(false); setQuery('') }
                }}
                placeholder="Typ je eigen sport..."
                className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-[#E87722] focus:ring-1 focus:ring-[#E87722]/20 placeholder:text-gray-400 transition-all"
              />
              <button
                type="button"
                onClick={handleCustomSubmit}
                disabled={!customInput.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#111111] text-white text-xs font-semibold disabled:opacity-30 hover:bg-[#333] transition-colors"
              >
                <Plus className="w-3 h-3" />
                Toevoegen
              </button>
            </div>
          </div>

          {/* Max selections hint */}
          {multiple && maxSelections && (
            <div className="px-3 py-2 border-t border-[#111111]/8 bg-white">
              <p className="text-xs text-gray-400">
                {selected.length} / {maxSelections} geselecteerd
                {maxReached && <span className="ml-1 text-[#E87722] font-semibold">— maximum bereikt</span>}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sport row sub-component ──────────────────────────────────────────────────

interface SportRowProps {
  emoji: string
  label: string
  selected: boolean
  focused: boolean
  disabled: boolean
  multiple: boolean
  onClick: () => void
}

function SportRow({ label, selected, focused, disabled, multiple, onClick }: SportRowProps) {
  return (
    <div
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      tabIndex={-1}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-colors ${
        focused
          ? 'bg-[#E87722]/10'
          : selected
          ? 'bg-[#E87722]/8'
          : disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-[#F5F0E8]'
      }`}
    >
      {multiple && (
        <span
          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border-2 transition-colors ${
            selected ? 'bg-[#E87722] border-[#E87722]' : 'border-gray-300'
          }`}
        >
          {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
        </span>
      )}
      <span className="text-sm font-medium text-gray-800 flex-1">{label}</span>
      {!multiple && selected && (
        <Check className="w-4 h-4 text-[#E87722] shrink-0" />
      )}
    </div>
  )
}
