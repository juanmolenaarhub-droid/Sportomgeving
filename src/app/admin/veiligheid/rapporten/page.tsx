'use client'

import { useState, useEffect, useTransition } from 'react'
import { AlertTriangle, ChevronDown, Download } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import { Avatar, getInitials } from '@/components/Avatar'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type Report = {
  id: string
  created_at: string
  reason: string
  description: string | null
  status: string
  admin_note: string | null
  reporter:      { id: string; full_name: string | null; username: string | null; avatar_url: string | null } | null
  reported_user: { id: string; full_name: string | null; username: string | null; avatar_url: string | null; created_at: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  open:          'Open',
  in_review:     'In behandeling',
  resolved:      'Opgelost',
  dismissed:     'Afgewezen',
}

const STATUS_COLORS: Record<string, string> = {
  open:      'bg-red-100 text-red-700',
  in_review: 'bg-orange-100 text-orange-700',
  resolved:  'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
}

const REDEN_LABELS: Record<string, string> = {
  spam:              'Spam',
  nep_profiel:       'Nep profiel',
  ongepast_gedrag:   'Ongepast gedrag',
  intimidatie:       'Intimidatie',
  ongepaste_foto:    'Ongepaste foto',
  overig:            'Overig',
}

function exportCsv(reports: Report[]) {
  const header = 'Datum,Melder,Gerapporteerde user,Reden,Status\n'
  const rows = reports.map(r =>
    [
      r.created_at,
      r.reporter?.username ?? r.reporter?.full_name ?? '',
      r.reported_user?.username ?? r.reported_user?.full_name ?? '',
      r.reason,
      r.status,
    ].join(',')
  ).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `rapporten-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function RapportenPage() {
  const [reports, setReports]           = useState<Report[]>([])
  const [loading, setLoading]           = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch]             = useState('')
  const [selected, setSelected]         = useState<Report | null>(null)
  const [noteInput, setNoteInput]       = useState('')
  const [statusInput, setStatusInput]   = useState('')
  const [isPending, startTransition]    = useTransition()

  useEffect(() => {
    async function load() {
      const admin = createAdminClient()
      const { data } = await admin
        .from('reports')
        .select(`
          id, created_at, reason, description, status, admin_note,
          reporter:reporter_id(id, full_name, username, avatar_url),
          reported_user:reported_user_id(id, full_name, username, avatar_url, created_at)
        `)
        .order('created_at', { ascending: false })
      setReports((data as unknown as Report[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = reports.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const reporter = (r.reporter?.username ?? r.reporter?.full_name ?? '').toLowerCase()
      const reported = (r.reported_user?.username ?? r.reported_user?.full_name ?? '').toLowerCase()
      if (!reporter.includes(q) && !reported.includes(q)) return false
    }
    return true
  })

  function openDetail(r: Report) {
    setSelected(r)
    setNoteInput(r.admin_note ?? '')
    setStatusInput(r.status)
  }

  async function saveDetail() {
    if (!selected) return
    startTransition(async () => {
      const admin = createAdminClient()
      await admin.from('reports').update({
        status:     statusInput,
        admin_note: noteInput,
        resolved_at: ['resolved', 'dismissed'].includes(statusInput) ? new Date().toISOString() : null,
      }).eq('id', selected.id)
      setReports(prev => prev.map(r => r.id === selected.id
        ? { ...r, status: statusInput, admin_note: noteInput }
        : r
      ))
      setSelected(null)
    })
  }

  async function deactivateUser(userId: string) {
    if (!confirm('Account deactiveren?')) return
    const admin = createAdminClient()
    await admin.from('profiles').update({ is_active: false }).eq('id', userId)
    await admin.from('security_events').insert({
      user_id:    userId,
      event_type: 'admin_action',
      metadata:   { action: 'account_deactivated', by: 'admin' },
    })
    alert('Account gedeactiveerd.')
  }

  if (loading) return (
    <div className="p-6 flex justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#E87722] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#111' }}>Misbruikrapporten</h1>
          <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">{filtered.length}</span>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 text-sm font-semibold hover:bg-black/5 transition-colors"
          style={SYNE}
        >
          <Download className="w-4 h-4" /> Exporteer CSV
        </button>
      </div>

      {/* Filterbalk */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-black/10 text-sm font-semibold bg-white focus:outline-none"
            style={SYNE}
          >
            <option value="all">Alle statussen</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Zoek op gebruikersnaam..."
          className="px-3 py-2 rounded-xl border border-black/10 text-sm bg-white focus:outline-none focus:border-[#E87722] flex-1 min-w-40"
          style={SYNE}
        />
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-[#FAFAF7]">
                {['Datum', 'Melder', 'Gerapporteerde user', 'Reden', 'Status', 'Actie'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider" style={SYNE}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Geen rapporten gevonden.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="hover:bg-[#FAFAF7] transition-colors">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('nl-NL')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initials={getInitials(r.reporter?.full_name ?? '?')} imageUrl={r.reporter?.avatar_url ?? null} size="xs" />
                      <span className="font-semibold text-gray-800">@{r.reporter?.username ?? r.reporter?.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initials={getInitials(r.reported_user?.full_name ?? '?')} imageUrl={r.reported_user?.avatar_url ?? null} size="xs" />
                      <span className="font-semibold text-gray-800">@{r.reported_user?.username ?? r.reported_user?.full_name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{REDEN_LABELS[r.reason] ?? r.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openDetail(r)}
                      className="text-xs font-bold text-[#E87722] border border-[#E87722]/30 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                      Bekijk
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#111' }}>Rapport details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>
            </div>

            <div className="space-y-2 text-sm">
              <p><span className="font-bold text-gray-500">Reden:</span> {REDEN_LABELS[selected.reason] ?? selected.reason}</p>
              {selected.description && (
                <p><span className="font-bold text-gray-500">Omschrijving:</span> {selected.description}</p>
              )}
              <p><span className="font-bold text-gray-500">Ingediend:</span> {new Date(selected.created_at).toLocaleString('nl-NL')}</p>
              {selected.reported_user && (
                <div className="bg-[#FAFAF7] rounded-xl p-3 flex items-center gap-3">
                  <Avatar initials={getInitials(selected.reported_user.full_name ?? '?')} imageUrl={selected.reported_user.avatar_url ?? null} size="sm" />
                  <div>
                    <p className="font-bold text-gray-900">@{selected.reported_user.username ?? selected.reported_user.full_name}</p>
                    <p className="text-xs text-gray-400">Lid sinds {new Date(selected.reported_user.created_at).toLocaleDateString('nl-NL')}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block" style={SYNE}>Status</label>
                <select
                  value={statusInput}
                  onChange={e => setStatusInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#E87722]"
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block" style={SYNE}>Admin notitie</label>
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#E87722] resize-none"
                  placeholder="Interne notitie..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={saveDetail}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-[#111] text-white text-sm font-bold disabled:opacity-40 transition-opacity"
                style={SYNE}
              >
                {isPending ? 'Opslaan...' : 'Opslaan'}
              </button>
              {selected.reported_user && (
                <button
                  onClick={() => deactivateUser(selected.reported_user!.id)}
                  className="px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-200 hover:bg-red-100 transition-colors"
                  style={SYNE}
                >
                  Deactiveer account
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
