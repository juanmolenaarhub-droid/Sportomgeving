'use client'

import { useState, useEffect, useTransition } from 'react'
import { FileText, Download, ChevronDown } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type AvgRequest = {
  id:              string
  created_at:      string
  user_id:         string | null
  user_email:      string
  request_type:    string
  status:          string
  request_details: string | null
  admin_note:      string | null
  deadline:        string
  completed_at:    string | null
}

const TYPE_LABELS: Record<string, string> = {
  inzage:      'Inzage',
  correctie:   'Correctie',
  verwijdering:'Verwijdering',
  overdracht:  'Data-overdracht',
  bezwaar:     'Bezwaar',
}

const STATUS_LABELS: Record<string, string> = {
  open:           'Open',
  in_behandeling: 'In behandeling',
  afgehandeld:    'Afgehandeld',
}

function daysLeft(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function urgencyClass(days: number): string {
  if (days < 7)  return 'text-red-600 font-black'
  if (days < 14) return 'text-orange-500 font-bold'
  return 'text-green-600 font-semibold'
}

function exportCsv(rows: AvgRequest[]) {
  const header = 'Datum,Email,Type,Status,Deadline,Dagen resterend\n'
  const body   = rows.map(r =>
    [r.created_at, r.user_email, r.request_type, r.status, r.deadline, daysLeft(r.deadline)].join(',')
  ).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `avg-verzoeken-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AvgPage() {
  const [rows, setRows]               = useState<AvgRequest[]>([])
  const [loading, setLoading]         = useState(true)
  const [statusFilter, setStatus]     = useState('all')
  const [selected, setSelected]       = useState<AvgRequest | null>(null)
  const [noteInput, setNoteInput]     = useState('')
  const [statusInput, setStatusInput] = useState('')
  const [isPending, startTransition]  = useTransition()

  useEffect(() => {
    async function load() {
      const admin = createAdminClient()
      const { data } = await admin
        .from('avg_requests')
        .select('*')
        .order('created_at', { ascending: false })
      setRows((data as AvgRequest[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = rows.filter(r =>
    statusFilter === 'all' || r.status === statusFilter
  )

  function openDetail(r: AvgRequest) {
    setSelected(r)
    setNoteInput(r.admin_note ?? '')
    setStatusInput(r.status)
  }

  async function saveDetail() {
    if (!selected) return
    startTransition(async () => {
      const admin = createAdminClient()
      const completed = statusInput === 'afgehandeld' ? new Date().toISOString() : null
      await admin.from('avg_requests').update({
        status:       statusInput,
        admin_note:   noteInput,
        completed_at: completed,
      }).eq('id', selected.id)
      setRows(prev => prev.map(r => r.id === selected.id
        ? { ...r, status: statusInput, admin_note: noteInput, completed_at: completed }
        : r
      ))
      setSelected(null)
    })
  }

  if (loading) return (
    <div className="p-6 flex justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#C4F542] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-500" />
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#1E2B20' }}>AVG-verzoeken</h1>
          <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{filtered.length}</span>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 text-sm font-semibold hover:bg-black/5 transition-colors"
          style={SYNE}
        >
          <Download className="w-4 h-4" /> Exporteer CSV
        </button>
      </div>

      <div className="relative inline-block">
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-black/10 text-sm font-semibold bg-white focus:outline-none"
          style={SYNE}
        >
          <option value="all">Alle statussen</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
      </div>

      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-[#FAFAF7]">
                {['Datum', 'E-mail', 'Type', 'Status', 'Deadline', 'Resterend', 'Actie'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider" style={SYNE}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Geen verzoeken gevonden.</td></tr>
              ) : filtered.map(r => {
                const days = daysLeft(r.deadline)
                return (
                  <tr key={r.id} className="hover:bg-[#FAFAF7] transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString('nl-NL')}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{r.user_email}</td>
                    <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[r.request_type] ?? r.request_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        r.status === 'afgehandeld' ? 'bg-green-100 text-green-700' :
                        r.status === 'in_behandeling' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(r.deadline).toLocaleDateString('nl-NL')}</td>
                    <td className={`px-4 py-3 whitespace-nowrap ${r.status === 'afgehandeld' ? 'text-gray-300' : urgencyClass(days)}`}>
                      {r.status === 'afgehandeld' ? '—' : `${days} dagen`}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(r)}
                        className="text-xs font-bold text-[#C4F542] border border-[#C4F542]/30 px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors"
                      >
                        Bekijk
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 style={{ ...SYNE, fontWeight: 800, fontSize: 16, color: '#1E2B20' }}>AVG-verzoek details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700 text-xl font-bold">&times;</button>
            </div>
            <div className="space-y-1.5 text-sm">
              <p><span className="font-bold text-gray-500">E-mail:</span> {selected.user_email}</p>
              <p><span className="font-bold text-gray-500">Type:</span> {TYPE_LABELS[selected.request_type] ?? selected.request_type}</p>
              <p><span className="font-bold text-gray-500">Deadline:</span> {new Date(selected.deadline).toLocaleDateString('nl-NL')} ({daysLeft(selected.deadline)} dagen)</p>
              {selected.request_details && (
                <p><span className="font-bold text-gray-500">Details:</span> {selected.request_details}</p>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block" style={SYNE}>Status</label>
                <select
                  value={statusInput}
                  onChange={e => setStatusInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm focus:outline-none"
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-1.5 block" style={SYNE}>Admin notitie</label>
                <textarea
                  value={noteInput}
                  onChange={e => setNoteInput(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm focus:outline-none resize-none"
                  placeholder="Interne notitie..."
                />
              </div>
            </div>
            <button
              onClick={saveDetail}
              disabled={isPending}
              className="w-full py-2.5 rounded-xl bg-[#111] text-white text-sm font-bold disabled:opacity-40"
              style={SYNE}
            >
              {isPending ? 'Opslaan...' : 'Markeer als afgehandeld & opslaan'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
