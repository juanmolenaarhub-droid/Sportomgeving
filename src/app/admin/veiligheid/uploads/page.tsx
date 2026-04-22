'use client'

import { useState, useEffect } from 'react'
import { Upload, Download, ChevronDown } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

type UploadEntry = {
  id:              string
  created_at:      string
  user_id:         string | null
  file_name:       string
  file_type:       string
  file_size_bytes: number
  bucket:          string
  upload_status:   string
  block_reason:    string | null
  profile?:        { username: string | null; full_name: string | null } | null
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function exportCsv(rows: UploadEntry[]) {
  const header = 'Tijdstip,User,Bestandsnaam,Type,Grootte,Status,Reden\n'
  const body   = rows.map(r =>
    [r.created_at, r.profile?.username ?? '', r.file_name, r.file_type, r.file_size_bytes, r.upload_status, r.block_reason ?? ''].join(',')
  ).join('\n')
  const blob = new Blob([header + body], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `uploads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function UploadsPage() {
  const [rows, setRows]             = useState<UploadEntry[]>([])
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatus]   = useState('all')

  useEffect(() => {
    async function load() {
      const admin = createAdminClient()
      const { data } = await admin
        .from('upload_log')
        .select('*, profile:user_id(username, full_name)')
        .order('created_at', { ascending: false })
        .limit(500)
      setRows((data as unknown as UploadEntry[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = rows.filter(r =>
    statusFilter === 'all' || r.upload_status === statusFilter
  )

  const today = new Date().toDateString()
  const todayRows     = rows.filter(r => new Date(r.created_at).toDateString() === today)
  const blockedToday  = todayRows.filter(r => r.upload_status === 'blocked').length
  const avgSize       = todayRows.length > 0 ? todayRows.reduce((s, r) => s + r.file_size_bytes, 0) / todayRows.length : 0
  const biggestToday  = todayRows.reduce((m, r) => Math.max(m, r.file_size_bytes), 0)

  const STATS = [
    { label: 'Uploads vandaag',          value: todayRows.length.toString() },
    { label: 'Geblokkeerd vandaag',      value: blockedToday.toString() },
    { label: 'Gemiddelde bestandsgrootte', value: formatBytes(avgSize) },
    { label: 'Grootste upload',          value: formatBytes(biggestToday) },
  ]

  if (loading) return (
    <div className="p-6 flex justify-center">
      <div className="w-6 h-6 border-2 border-gray-200 border-t-[#E87722] rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-purple-500" />
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#111' }}>Upload Log</h1>
          <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full">{filtered.length}</span>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-black/10 text-sm font-semibold hover:bg-black/5 transition-colors"
          style={SYNE}
        >
          <Download className="w-4 h-4" /> Exporteer CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-black/8 p-4">
            <p className="text-xl font-black text-[#111]" style={SYNE}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="relative inline-block">
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-black/10 text-sm font-semibold bg-white focus:outline-none"
          style={SYNE}
        >
          <option value="all">Alle statussen</option>
          <option value="success">Success</option>
          <option value="blocked">Geblokkeerd</option>
          <option value="failed">Mislukt</option>
        </select>
        <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
      </div>

      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 bg-[#FAFAF7]">
                {['Tijdstip', 'User', 'Bestandsnaam', 'Type', 'Grootte', 'Status', 'Reden geblokkeerd'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider" style={SYNE}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Geen uploads gevonden.</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className={`hover:bg-[#FAFAF7] transition-colors ${r.upload_status === 'blocked' ? 'bg-red-50/50' : ''}`}>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString('nl-NL')}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{r.profile?.username ?? r.profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-40 truncate">{r.file_name}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.file_type}</td>
                  <td className="px-4 py-3 text-gray-600">{formatBytes(r.file_size_bytes)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      r.upload_status === 'success' ? 'bg-green-100 text-green-700' :
                      r.upload_status === 'blocked' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {r.upload_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{r.block_reason ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
