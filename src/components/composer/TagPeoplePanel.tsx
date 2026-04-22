'use client'

import { useState, useEffect, useRef } from 'react'
import { UserRoundPlus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Avatar, getInitials } from '@/components/Avatar'

interface TaggedUser {
  id: string
  name: string
  username: string
  avatarUrl?: string
}

interface TagPeoplePanelProps {
  taggedIds: string[]
  taggedNames: TaggedUser[]
  onAdd: (user: TaggedUser) => void
  onRemove: (id: string) => void
  currentUserId: string
}

interface ProfileRow {
  id: string
  full_name: string
  username: string
  avatar_url: string | null
}

const MAX_TAGGED = 20

export default function TagPeoplePanel({
  taggedIds,
  taggedNames,
  onAdd,
  onRemove,
  currentUserId,
}: TagPeoplePanelProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    if (inputRef.current) inputRef.current.focus()
  }, [open])

  useEffect(() => {
    if (!open) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()
    if (trimmed.length < 1) {
      setResults([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .or(`username.ilike.%${trimmed}%,full_name.ilike.%${trimmed}%`)
          .neq('id', currentUserId)
          .limit(8)

        const rows = (data ?? []) as ProfileRow[]
        setResults(rows.filter((r) => !taggedIds.includes(r.id)))
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, open, currentUserId, taggedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleAdd(row: ProfileRow) {
    if (taggedIds.length >= MAX_TAGGED) return
    onAdd({
      id: row.id,
      name: row.full_name,
      username: row.username,
      avatarUrl: row.avatar_url ?? undefined,
    })
    setQuery('')
    setResults([])
  }

  return (
    <div className="w-full" style={{ borderBottom: '1px solid #F5F2EE' }}>
      {/* Trigger row */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#FAFAF7] transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <UserRoundPlus size={16} className="text-gray-400" />
          <span
            style={{ fontFamily: "'Syne', sans-serif" }}
            className="text-[14px] text-gray-700"
          >
            Mensen taggen
          </span>
        </div>

        {taggedNames.length > 0 && (
          <span className="text-[12px] text-gray-400">{taggedNames.length} getagd</span>
        )}
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3">
          {/* Tagged pills */}
          {taggedNames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {taggedNames.map((user) => (
                <span
                  key={user.id}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] text-gray-700 border"
                  style={{ borderColor: '#F5F2EE', backgroundColor: '#FAFAF7' }}
                >
                  <Avatar
                    imageUrl={user.avatarUrl ?? null}
                    initials={getInitials(user.name)}
                    size="xs"
                  />
                  <span className="font-medium">{user.name}</span>
                  <button
                    type="button"
                    aria-label={`${user.name} verwijderen`}
                    onClick={() => onRemove(user.id)}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <input
            ref={inputRef}
            type="text"
            placeholder="@gebruikersnaam of naam"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={taggedIds.length >= MAX_TAGGED}
            className="w-full px-3 py-2 text-[14px] text-gray-700 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#E87722] disabled:opacity-50"
            style={{ borderColor: '#F5F2EE', backgroundColor: '#FAFAF7' }}
          />

          {taggedIds.length >= MAX_TAGGED && (
            <p className="text-[12px] text-gray-400">
              Maximaal {MAX_TAGGED} personen getagd.
            </p>
          )}

          {loading && (
            <p className="text-[12px] text-gray-400">Zoeken…</p>
          )}

          {/* Results list */}
          {!loading && results.length > 0 && (
            <ul className="rounded-lg overflow-hidden border" style={{ borderColor: '#F5F2EE' }}>
              {results.map((row, i) => (
                <li
                  key={row.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{ borderBottom: i < results.length - 1 ? '1px solid #F5F2EE' : undefined }}
                >
                  <Avatar
                    imageUrl={row.avatar_url ?? null}
                    initials={getInitials(row.full_name)}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate">
                      {row.full_name}
                    </p>
                    <p className="text-[12px] text-gray-400 truncate">@{row.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(row)}
                    disabled={taggedIds.length >= MAX_TAGGED}
                    className="flex-shrink-0 px-3 py-1 rounded-full text-[12px] font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none disabled:opacity-40"
                    style={{ backgroundColor: '#E87722', fontFamily: "'Syne', sans-serif" }}
                  >
                    Toevoegen
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!loading && query.trim().length >= 1 && results.length === 0 && (
            <p className="text-[12px] text-gray-400">Geen gebruikers gevonden.</p>
          )}
        </div>
      )}
    </div>
  )
}
