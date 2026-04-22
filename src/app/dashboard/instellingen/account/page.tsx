'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Eye, EyeOff, AlertTriangle, Crown } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { updateAccountEmail, updateAccountPassword, deactivateAccount } from '@/app/actions/settings'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
      <Check className="w-4 h-4 text-green-400" /> {msg}
    </div>
  )
}

function DeactivateModal({ onConfirm, onCancel, loading }: { onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p style={{ ...SYNE, fontWeight: 800, fontSize: 15, color: '#1E2B20' }}>Account deactiveren?</p>
            <p className="text-xs text-gray-400 mt-0.5">Je profiel wordt verborgen voor anderen</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Je kunt je account opnieuw activeren door opnieuw in te loggen. Je gegevens blijven bewaard.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl border border-black/10 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Bezig...' : 'Deactiveren'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AccountInstellingenPage() {
  const router = useRouter()
  const supabase = createClient()

  const [currentEmail, setCurrentEmail] = useState('')
  const [newEmail, setNewEmail]         = useState('')
  const [emailPending, startEmailTransition]       = useTransition()
  const [emailError, setEmailError]     = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState(false)

  const [currentPw, setCurrentPw]       = useState('')
  const [newPw, setNewPw]               = useState('')
  const [confirmPw, setConfirmPw]       = useState('')
  const [showPw, setShowPw]             = useState(false)
  const [pwPending, startPwTransition]             = useTransition()
  const [pwError, setPwError]           = useState<string | null>(null)
  const [toast, setToast]               = useState<string | null>(null)

  const [showDeactivate, setShowDeactivate] = useState(false)
  const [deactivating, setDeactivating]     = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setCurrentEmail(user.email)
    })
  }, [])

  function handleEmailSave() {
    setEmailError(null)
    setEmailSuccess(false)
    if (!newEmail.trim()) { setEmailError('Vul een nieuw e-mailadres in'); return }
    startEmailTransition(async () => {
      const res = await updateAccountEmail(newEmail.trim())
      if (res.success) { setEmailSuccess(true); setNewEmail('') }
      else setEmailError(res.error ?? 'Er ging iets mis')
    })
  }

  function handlePasswordSave() {
    setPwError(null)
    if (!currentPw || !newPw || !confirmPw) { setPwError('Vul alle velden in'); return }
    if (newPw !== confirmPw) { setPwError('Nieuwe wachtwoorden komen niet overeen'); return }
    if (newPw.length < 8) { setPwError('Wachtwoord moet minimaal 8 tekens zijn'); return }
    startPwTransition(async () => {
      const res = await updateAccountPassword(currentPw, newPw)
      if (res.success) {
        setToast('Wachtwoord gewijzigd!')
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
      } else {
        setPwError(res.error ?? 'Er ging iets mis')
      }
    })
  }

  async function handleDeactivate() {
    setDeactivating(true)
    const res = await deactivateAccount()
    if (res.success) {
      await supabase.auth.signOut()
      router.push('/')
    } else {
      setDeactivating(false)
      setShowDeactivate(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/instellingen" className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </Link>
        <div>
          <p className="text-xs text-gray-400">Instellingen › Account</p>
          <h1 style={{ ...SYNE, fontWeight: 900, fontSize: 20, color: '#1E2B20' }}>Account</h1>
        </div>
      </div>

      {/* E-mail */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#1E2B20' }}>E-mailadres wijzigen</p>
        <div>
          <p className="text-xs text-gray-400 mb-1">Huidig e-mailadres</p>
          <p className="text-sm font-semibold text-gray-400 bg-gray-50 px-4 py-3 rounded-xl">{currentEmail || '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Nieuw e-mailadres</p>
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="nieuw@email.nl"
            className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4F542] transition-colors"
          />
        </div>
        {emailError && <p className="text-xs text-red-500 font-semibold">{emailError}</p>}
        {emailSuccess && (
          <div className="flex items-center gap-2 text-xs text-green-600 font-semibold bg-green-50 px-3 py-2 rounded-xl">
            <Check className="w-4 h-4" /> Controleer je inbox om te bevestigen.
          </div>
        )}
        <button
          onClick={handleEmailSave}
          disabled={emailPending}
          className="w-full py-3 bg-[#111] text-white text-sm font-bold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40"
          style={SYNE}
        >
          {emailPending ? 'Wijzigen...' : 'E-mail wijzigen'}
        </button>
      </div>

      {/* Wachtwoord */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#1E2B20' }}>Wachtwoord wijzigen</p>
          <button onClick={() => setShowPw(v => !v)} className="text-gray-400 hover:text-gray-600 transition-colors">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {[
          { label: 'Huidig wachtwoord', value: currentPw, set: setCurrentPw },
          { label: 'Nieuw wachtwoord', value: newPw, set: setNewPw },
          { label: 'Herhaal nieuw wachtwoord', value: confirmPw, set: setConfirmPw },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <input
              type={showPw ? 'text' : 'password'}
              value={value}
              onChange={e => set(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4F542] transition-colors"
            />
          </div>
        ))}
        {pwError && <p className="text-xs text-red-500 font-semibold">{pwError}</p>}
        <button
          onClick={handlePasswordSave}
          disabled={pwPending}
          className="w-full py-3 bg-[#111] text-white text-sm font-bold rounded-xl hover:bg-[#333] transition-colors disabled:opacity-40"
          style={SYNE}
        >
          {pwPending ? 'Opslaan...' : 'Wachtwoord wijzigen'}
        </button>
      </div>

      {/* Abonnement */}
      <div className="bg-white rounded-2xl border border-black/8 p-5 space-y-4">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#1E2B20' }}>Abonnement</p>
        <div className="flex items-center justify-between p-4 bg-[#F4F1E8] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Crown className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Gratis plan</p>
              <p className="text-xs text-gray-400">€0 / maand</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="text-xs font-bold bg-[#111] text-white px-4 py-2 rounded-lg hover:bg-[#C4F542] transition-colors"
            style={SYNE}
          >
            Upgraden
          </Link>
        </div>
        <p className="text-xs text-gray-400">Pro — €4,99 / maand · Verified badge, uitgebreide analytics en meer.</p>
      </div>

      {/* Gevaarzone */}
      <div className="bg-white rounded-2xl border border-red-100 p-5 space-y-3">
        <p style={{ ...SYNE, fontWeight: 800, fontSize: 14, color: '#E53E3E' }}>Gevaarzone</p>
        <p className="text-xs text-gray-500">Als je je account deactiveert wordt je profiel verborgen voor andere gebruikers. Je kunt je account altijd opnieuw activeren.</p>
        <button
          onClick={() => setShowDeactivate(true)}
          className="w-full py-3 border border-red-200 text-red-500 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors"
        >
          Account deactiveren
        </button>
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      {showDeactivate && (
        <DeactivateModal
          onConfirm={handleDeactivate}
          onCancel={() => setShowDeactivate(false)}
          loading={deactivating}
        />
      )}
    </div>
  )
}
