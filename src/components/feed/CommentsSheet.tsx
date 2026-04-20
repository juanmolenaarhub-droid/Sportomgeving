'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const DM:   React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" }
const ACCENT = '#E87722'
const INK    = '#111111'

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  profile: { full_name: string | null; username: string | null; avatar_url: string | null }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (m < 1) return 'Nu'
  if (m < 60) return `${m}m`
  if (h < 24) return `${h}u`
  return `${d}d`
}

function Avatar({ name, url, size }: { name: string; url: string | null; size: number }) {
  const colors = ['#E87722', '#2A2420', '#11998e', '#6366F1', '#DB2777']
  const bg = colors[name.charCodeAt(0) % colors.length]
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ ...DM, fontSize: size * 0.38, fontWeight: 700, color: 'white' }}>
        {name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
      </span>
    </div>
  )
}

interface Props {
  postId: string
  onClose: () => void
  onCountChange?: (delta: number) => void
}

export function CommentsSheet({ postId, onClose, onCountChange }: Props) {
  const [comments,   setComments]   = useState<Comment[]>([])
  const [loading,    setLoading]    = useState(true)
  const [text,       setText]       = useState('')
  const [sending,    setSending]    = useState(false)
  const [currentUid, setCurrentUid] = useState<string | null>(null)
  const [currentProfile, setCurrentProfile] = useState<{ name: string; url: string | null } | null>(null)
  const listRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUid(user?.id ?? null)

      if (user) {
        const { data: prof } = await supabase.from('profiles').select('full_name, username, avatar_url').eq('id', user.id).single()
        setCurrentProfile({ name: prof?.full_name ?? prof?.username ?? 'Jij', url: prof?.avatar_url ?? null })
      }

      const { data } = await supabase
        .from('post_comments')
        .select('id, content, created_at, user_id, profiles(full_name, username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (data) {
        setComments(data.map((c: Record<string, unknown>) => ({
          id:         c.id as string,
          content:    c.content as string,
          created_at: c.created_at as string,
          user_id:    c.user_id as string,
          profile:    (Array.isArray(c.profiles) ? c.profiles[0] : c.profiles) as Comment['profile'] ?? { full_name: null, username: null, avatar_url: null },
        })))
      }
      setLoading(false)
    }
    load()
  }, [postId])

  // Scroll to bottom when comments load
  useEffect(() => {
    if (!loading && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [loading])

  async function handleSend() {
    if (!text.trim() || sending || !currentUid) return
    setSending(true)
    const optimistic: Comment = {
      id:         `opt-${Date.now()}`,
      content:    text.trim(),
      created_at: new Date().toISOString(),
      user_id:    currentUid,
      profile:    { full_name: currentProfile?.name ?? null, username: null, avatar_url: currentProfile?.url ?? null },
    }
    setComments(prev => [...prev, optimistic])
    setText('')
    onCountChange?.(1)
    setTimeout(() => listRef.current && (listRef.current.scrollTop = listRef.current.scrollHeight), 50)

    const supabase = createClient()
    const { data } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: currentUid, content: optimistic.content })
      .select('id')
      .single()

    if (data) {
      setComments(prev => prev.map(c => c.id === optimistic.id ? { ...c, id: data.id } : c))
    }
    setSending(false)
  }

  async function handleDelete(commentId: string) {
    setComments(prev => prev.filter(c => c.id !== commentId))
    onCountChange?.(-1)
    const supabase = createClient()
    await supabase.from('post_comments').delete().eq('id', commentId)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />

      {/* Sheet */}
      <div
        style={{
          position: 'relative', zIndex: 1,
          background: '#fff',
          borderRadius: '24px 24px 0 0',
          display: 'flex', flexDirection: 'column',
          maxHeight: '72vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E7EB' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 12px' }}>
          <span style={{ ...SYNE, fontWeight: 900, fontSize: 16, color: INK }}>
            Reacties {comments.length > 0 && <span style={{ color: ACCENT }}>{comments.length}</span>}
          </span>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 999, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={14} color="#666" />
          </button>
        </div>

        {/* Comment list */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '0 20px', minHeight: 120 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', border: `3px solid #f3f4f6`, borderTopColor: ACCENT, animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', ...DM, fontSize: 14, color: '#999' }}>
              Nog geen reacties. Wees de eerste!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 12 }}>
              {comments.map(c => {
                const name = c.profile?.full_name ?? c.profile?.username ?? 'Gebruiker'
                const isOwn = c.user_id === currentUid
                return (
                  <div key={c.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Avatar name={name} url={c.profile?.avatar_url ?? null} size={34} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                        <span style={{ ...DM, fontSize: 13, fontWeight: 700, color: INK }}>{name}</span>
                        <span style={{ ...DM, fontSize: 11, color: '#aaa' }}>{timeAgo(c.created_at)}</span>
                      </div>
                      <p style={{ ...DM, fontSize: 14, color: '#333', lineHeight: 1.45, margin: 0 }}>{c.content}</p>
                    </div>
                    {isOwn && (
                      <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                        <Trash2 size={14} color="#ccc" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid #f3f4f6', padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
          {currentProfile && <Avatar name={currentProfile.name} url={currentProfile.url} size={32} />}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: 999, padding: '0 14px', height: 40 }}>
            <input
              ref={inputRef}
              value={text}
              onChange={e => setText(e.target.value.slice(0, 500))}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Schrijf een reactie..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', ...DM, fontSize: 16, color: INK }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: text.trim() ? ACCENT : '#f3f4f6', cursor: text.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 150ms',
            }}
          >
            <Send size={16} color={text.trim() ? 'white' : '#ccc'} />
          </button>
        </div>
      </div>
    </div>
  )
}
