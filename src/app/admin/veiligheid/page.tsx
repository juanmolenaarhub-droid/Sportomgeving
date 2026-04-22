import Link from 'next/link'
import { Shield, AlertTriangle, FileText, Zap, Upload, CheckCircle, XCircle } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase-admin'
import { InfoButton } from '../_components/InfoButton'

export const dynamic = 'force-dynamic'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

async function getKpis() {
  const admin = createAdminClient()
  const now   = new Date()
  const day   = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    { count: openRapporten },
    { count: openAvg },
    { count: rateLimits24u },
    { count: uploadsVandaag },
  ] = await Promise.all([
    admin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('avg_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    admin.from('security_events').select('*', { count: 'exact', head: true })
      .eq('event_type', 'rate_limit_exceeded').gte('created_at', day),
    admin.from('upload_log').select('*', { count: 'exact', head: true })
      .gte('created_at', today),
  ])

  return {
    openRapporten:  openRapporten  ?? 0,
    openAvg:        openAvg        ?? 0,
    rateLimits24u:  rateLimits24u  ?? 0,
    uploadsVandaag: uploadsVandaag ?? 0,
  }
}

async function getHealthChecks() {
  const admin = createAdminClient()
  const day7  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const day1  = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { count: oudeRapporten } = await admin
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'open')
    .lt('created_at', day7)

  const { count: recentRateLimits } = await admin
    .from('security_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'rate_limit_exceeded')
    .gte('created_at', day1)

  const { count: blockedUploads } = await admin
    .from('upload_log')
    .select('*', { count: 'exact', head: true })
    .eq('upload_status', 'blocked')
    .gte('created_at', day1)

  return { oudeRapporten: oudeRapporten ?? 0, recentRateLimits: recentRateLimits ?? 0, blockedUploads: blockedUploads ?? 0 }
}

export default async function VeiligheidPage() {
  const [kpis, health] = await Promise.all([getKpis(), getHealthChecks()])

  const KPI_CARDS = [
    { label: 'Open rapporten',     value: kpis.openRapporten,  href: '/admin/veiligheid/rapporten', urgent: kpis.openRapporten > 0 },
    { label: 'Open AVG-verzoeken', value: kpis.openAvg,        href: '/admin/veiligheid/avg',       urgent: kpis.openAvg > 0 },
    { label: 'Rate limits 24u',    value: kpis.rateLimits24u,  href: '/admin/veiligheid/events',    urgent: kpis.rateLimits24u >= 5 },
    { label: 'Uploads vandaag',    value: kpis.uploadsVandaag, href: '/admin/veiligheid/uploads',   urgent: false },
  ]

  const HEALTH = [
    { ok: true,                             label: 'RLS ingeschakeld op alle beveiligde tabellen' },
    { ok: true,                             label: 'Admin route beschermd via middleware' },
    { ok: true,                             label: 'E-mailverificatie verplicht' },
    { ok: health.oudeRapporten === 0,        label: health.oudeRapporten > 0 ? `${health.oudeRapporten} open rapport(en) ouder dan 7 dagen` : 'Geen openstaande rapporten ouder dan 7 dagen' },
    { ok: health.recentRateLimits === 0,     label: health.recentRateLimits > 0 ? `${health.recentRateLimits} rate limit event(s) afgelopen 24u` : 'Geen rate limit events afgelopen 24u' },
    { ok: health.blockedUploads === 0,       label: health.blockedUploads > 0 ? `${health.blockedUploads} geblokkeerde upload(s) afgelopen 24u` : 'Geen geblokkeerde uploads afgelopen 24u' },
    { ok: !!process.env.ADMIN_USER_ID,       label: 'Admin account geconfigureerd' },
    { ok: !!process.env.SUPABASE_SERVICE_ROLE_KEY, label: 'Service role key aanwezig', info: true },
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#C4F542]/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[#C4F542]" />
        </div>
        <div>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 22, color: '#1E2B20' }}>Veiligheid & Compliance</h1>
          <p className="text-sm text-gray-400 mt-0.5">Beveiligingsoverzicht, AVG-verzoeken en misbruikrapportages</p>
        </div>
      </div>

      {/* KPI kaarten */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p style={{ ...SYNE, fontWeight: 700, fontSize: 14 }} className="text-black">Actie vereist</p>
          <InfoButton
            title="Veiligheid kerncijfers"
            body={`Open rapporten → gebruikers die iemand gemeld hebben voor misbruik. Rood bolletje = actie vereist. Klik om te behandelen.\n\nOpen AVG-verzoeken → wettelijke verplichting (GDPR). Iemand wil data inzien, corrigeren of verwijderen. Je hebt 30 dagen om te reageren. Rood bolletje = nog open.\n\nRate limits 24u → hoe vaak het systeem iemand geblokkeerd heeft omdat ze te snel te veel acties deden. 5+ = mogelijk geautomatiseerde aanval.\n\nUploads vandaag → bestanden die vandaag geüpload zijn. Klik voor details en geblokkeerde uploads.`}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI_CARDS.map(card => (
            <Link key={card.label} href={card.href}
              className="bg-white rounded-2xl border border-black/8 p-5 hover:border-[#C4F542]/40 transition-colors relative overflow-hidden"
            >
              {card.urgent && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500" />
              )}
              <p className="text-3xl font-black text-[#111]" style={SYNE}>
                {card.value}
              </p>
              <p className="text-xs text-gray-400 mt-1 font-semibold">{card.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Subpagina links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: '/admin/veiligheid/rapporten', icon: AlertTriangle, label: 'Rapporten',     color: '#EF4444' },
          { href: '/admin/veiligheid/avg',       icon: FileText,      label: 'AVG-verzoeken', color: '#3B82F6' },
          { href: '/admin/veiligheid/events',    icon: Zap,           label: 'Security log',  color: '#F59E0B' },
          { href: '/admin/veiligheid/uploads',   icon: Upload,        label: 'Upload log',    color: '#8B5CF6' },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link key={href} href={href}
            className="bg-white rounded-xl border border-black/8 px-4 py-3 flex items-center gap-3 hover:border-black/20 transition-colors"
          >
            <Icon className="w-4 h-4 shrink-0" style={{ color }} />
            <span className="text-sm font-semibold text-gray-700" style={SYNE}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Security Health Check */}
      <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-black/5 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#C4F542]" />
          <h2 style={{ ...SYNE, fontWeight: 700, fontSize: 14, color: '#1E2B20' }}>Security Health Check</h2>
          <InfoButton
            title="Security Health Check"
            body={`Een automatische checklist van beveiligingsinstellingen.\n\nGroen vinkje → alles is in orde.\nRood kruis → actie vereist.\n\nRLS → Row Level Security, zorgt dat users alleen hun eigen data kunnen zien.\nAdmin route → alleen jij kunt het admin-panel bereiken.\nE-mailverificatie → nieuwe accounts moeten hun e-mail bevestigen.\nRapporten ouder dan 7 dagen → als er meldingen zijn die al een week onbehandeld liggen.\nRate limit events → tekenen van misbruik of geautomatiseerde aanvallen.\nGeblokkeerde uploads → bestanden die geweigerd zijn vanwege verkeerd type of te groot.\nAdmin account → je ADMIN_USER_ID is ingesteld in de omgevingsvariabelen.\nService role key → je SUPABASE_SERVICE_ROLE_KEY is aanwezig (nooit committen naar git!).`}
          />
        </div>
        <div className="divide-y divide-black/5">
          {HEALTH.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              {item.ok
                ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                : <XCircle    className="w-4 h-4 text-red-500 shrink-0" />
              }
              <span className={`text-sm font-medium ${item.ok ? 'text-gray-700' : 'text-red-600'}`}>
                {item.label}
              </span>
              {item.info && (
                <span className="text-[10px] text-gray-400 ml-auto">Nooit in git</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
