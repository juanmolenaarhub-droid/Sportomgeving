'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, ChevronUp, ShieldOff, CheckCircle, XCircle, Shield } from 'lucide-react'
import Link from 'next/link'
import { updateReport, blockAccount, unblockAccount, removeBlock } from '../actions'
import type { ReportRow, BlockedRow } from '../page'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

const CATEGORIES = [
  'Alle categorieën',
  'Ongepaste of beledigende berichten',
  'Intimidatie of bedreiging',
  'Spam of nep-profiel',
  'Minderjarige gebruiker',
  'Gevaarlijk of grensoverschrijdend gedrag',
  'Haatdragende of discriminerende uitingen',
  'Overig',
]

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  open:       { label: 'Open',       cls: 'bg-[#C4F542]/15 text-[#C4F542]' },
  in_review:  { label: 'In review',  cls: 'bg-blue-100 text-blue-700' },
  resolved:   { label: 'Opgelost',   cls: 'bg-green-100 text-green-700' },
  dismissed:  { label: 'Gesloten',   cls: 'bg-gray-100 text-gray-500' },
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABELS[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${s.cls}`}>
      {s.label}
    </span>
  )
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Uitklapbaar rapport paneel ────────────────────────────────────────────────
function ReportPanel({ report, onUpdate }: { report: ReportRow; onUpdate: () => void }) {
  const [note, setNote] = useState(report.admin_note ?? '')
  const [status, setStatus] = useState(report.status)
  const [saving, setSaving] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function save() {
    setSaving(true)
    await updateReport(report.id, status, note)
    setSaving(false)
    onUpdate()
  }

  async function handleBlock() {
    setBlocking(true)
    await blockAccount(report.reported_user_id)
    setBlocking(false)
    onUpdate()
  }

  async function handleUnblock() {
    setBlocking(true)
    await unblockAccount(report.reported_user_id)
    setBlocking(false)
    onUpdate()
  }

  return (
    <div className="bg-[#F4F1E8] border-t border-black/8 px-6 py-5 space-y-4">
      {/* Volledige beschrijving */}
      {report.description && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Beschrijving</p>
          <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Status wijzigen */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as ReportRow['status'])}
            className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#C4F542]/40"
          >
            <option value="open">Open</option>
            <option value="in_review">In review</option>
            <option value="resolved">Opgelost</option>
            <option value="dismissed">Gesloten</option>
          </select>
        </div>

        {/* Account actie */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Account</p>
          {report.reported_user_active ? (
            <button
              onClick={handleBlock}
              disabled={blocking}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 w-full justify-center"
            >
              <ShieldOff className="w-4 h-4" />
              {blocking ? 'Blokkeren...' : 'Account blokkeren'}
            </button>
          ) : (
            <button
              onClick={handleUnblock}
              disabled={blocking}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 w-full justify-center"
            >
              <Shield className="w-4 h-4" />
              {blocking ? 'Deblokkeren...' : 'Account deblokkeren'}
            </button>
          )}
        </div>
      </div>

      {/* Admin notitie */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Admin notitie</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="Interne notitie (niet zichtbaar voor gebruikers)..."
          className="w-full bg-white border border-black/10 rounded-xl px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#C4F542]/40 resize-none"
        />
      </div>

      {/* Snelacties */}
      <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
        <div className="flex gap-2">
          <button
            disabled={isPending}
            onClick={() => { startTransition(() => updateReport(report.id, 'resolved', note).then(onUpdate)) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" /> Markeer als opgelost
          </button>
          <button
            disabled={isPending}
            onClick={() => { startTransition(() => updateReport(report.id, 'dismissed', note).then(onUpdate)) }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" /> Verwerp melding
          </button>
        </div>
        <button
          onClick={save}
          disabled={saving}
          style={SYNE}
          className="px-4 py-1.5 bg-[#111] hover:bg-[#333] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </div>
  )
}

// ── Hoofdcomponent ────────────────────────────────────────────────────────────
export function IssuesClient({ reports, blocked }: { reports: ReportRow[]; blocked: BlockedRow[] }) {
  const [tab, setTab] = useState<'reports' | 'blocked'>('reports')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState('alle')
  const [filterCategory, setFilterCategory] = useState('Alle categorieën')
  const [search, setSearch] = useState('')
  const [localReports, setLocalReports] = useState(reports)
  const [localBlocked, setLocalBlocked] = useState(blocked)
  const [isPending, startTransition] = useTransition()

  const filteredReports = localReports.filter(r => {
    const matchStatus = filterStatus === 'alle' || r.status === filterStatus
    const matchCat = filterCategory === 'Alle categorieën' || r.category === filterCategory
    const matchSearch = !search || r.reported_user_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchCat && matchSearch
  })

  function refreshReport(updated: Partial<ReportRow> & { id: string }) {
    setLocalReports(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
  }

  return (
    <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-black/8">
        {(['reports', 'blocked'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={tab === t ? SYNE : {}}
            className={`px-6 py-4 text-sm font-bold transition-colors ${tab === t ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t === 'reports' ? `Rapporten (${localReports.filter(r => r.status === 'open').length} open)` : `Geblokkeerd (${localBlocked.length})`}
          </button>
        ))}
      </div>

      {tab === 'reports' && (
        <>
          {/* Filters */}
          <div className="px-6 py-4 border-b border-black/5 flex flex-wrap gap-3 bg-[#F4F1E8]/50">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoek op gebruikersnaam..."
              className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#C4F542]/40 w-48"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#C4F542]/40"
            >
              {['alle', 'open', 'in_review', 'resolved', 'dismissed'].map(s => (
                <option key={s} value={s}>{s === 'alle' ? 'Alle statussen' : STATUS_LABELS[s]?.label ?? s}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="bg-white border border-black/10 rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-[#C4F542]/40 max-w-[220px]"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Tabel */}
          {filteredReports.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-400 text-sm">Geen meldingen gevonden.</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {filteredReports.map(report => (
                <div key={report.id}>
                  <div
                    className={`px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-[#F4F1E8]/40 transition-colors ${expandedId === report.id ? 'bg-[#F4F1E8]/60' : ''}`}
                    onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                  >
                    {/* Datum */}
                    <span className="text-xs text-gray-400 w-24 shrink-0">{formatDate(report.created_at)}</span>

                    {/* Melder */}
                    <span className="text-xs text-gray-400 w-20 shrink-0">Gebruiker</span>

                    {/* Gemelde */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/profile/${report.reported_user_id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-sm font-bold text-black hover:text-[#C4F542] transition-colors"
                      >
                        {report.reported_user_name}
                      </Link>
                      {!report.reported_user_active && (
                        <span className="ml-2 text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Geblokkeerd</span>
                      )}
                    </div>

                    {/* Categorie */}
                    <span className="text-xs text-gray-500 hidden lg:block w-44 shrink-0 truncate">{report.category}</span>

                    {/* Beschrijving preview */}
                    <span className="text-xs text-gray-400 hidden xl:block flex-1 truncate">
                      {report.description ?? '—'}
                    </span>

                    {/* Status */}
                    <div className="shrink-0">
                      <StatusBadge status={report.status} />
                    </div>

                    {/* Expand icon */}
                    <div className="shrink-0 text-gray-400">
                      {expandedId === report.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>

                  {expandedId === report.id && (
                    <ReportPanel
                      report={report}
                      onUpdate={() => refreshReport({ id: report.id })}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'blocked' && (
        <div className="divide-y divide-black/5">
          {localBlocked.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-gray-400 text-sm">Geen geblokkeerde gebruikers.</p>
            </div>
          ) : (
            localBlocked.map(row => (
              <div key={row.id} className="px-6 py-4 flex items-center gap-4">
                <span className="text-xs text-gray-400 w-24 shrink-0">{formatDate(row.created_at)}</span>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/dashboard/profile/${row.blocked_id}`}
                    className="text-sm font-bold text-black hover:text-[#C4F542] transition-colors"
                  >
                    {row.blocked_name}
                  </Link>
                </div>
                <span className="text-xs text-gray-400 font-mono hidden sm:block">{row.blocked_id.slice(0, 10)}…</span>
                <button
                  disabled={isPending}
                  onClick={() => startTransition(async () => {
                    await removeBlock(row.id)
                    setLocalBlocked(prev => prev.filter(b => b.id !== row.id))
                  })}
                  className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  Verwijder blokkade
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
