'use client'

import { useState } from 'react'
import { ArrowLeft, Users } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import {
  updateMeetup,
  deleteMeetup,
  removeParticipant,
  confirmAttendance,
  cancelMeetup,
  closeMeetup,
  type MeetupModalDetail,
  type ModalParticipant,
} from '@/app/actions/meetups'

const SYNE: React.CSSProperties = { fontFamily: "'Syne', sans-serif" }
const SECTION: React.CSSProperties = {
  background: '#fff', borderRadius: 12, padding: 16, margin: '0 16px 12px',
}
const SECTION_LABEL: React.CSSProperties = {
  fontSize: 11, color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.08em',
  textTransform: 'uppercase', marginBottom: 12,
}
const INPUT: React.CSSProperties = {
  width: '100%', border: '1.5px solid rgba(0,0,0,0.10)', borderRadius: 10,
  padding: '10px 12px', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box', background: '#fff',
}
const LABEL: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 4,
}
const BTN_PRIMARY: React.CSSProperties = {
  width: '100%', background: '#C4F542', color: '#fff', border: 'none',
  borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
}
const BTN_DANGER: React.CSSProperties = {
  width: '100%', background: '#fff', color: '#DC2626',
  border: '1.5px solid #DC2626', borderRadius: 10, padding: '12px',
  fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  marginBottom: 8,
}
const BTN_OUTLINE: React.CSSProperties = {
  width: '100%', background: '#fff', color: '#1E2B20',
  border: '1.5px solid #111', borderRadius: 10, padding: '12px',
  fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
}

type Props = {
  data: MeetupModalDetail
  meetupId: string
  visible: boolean
  onBack: () => void
  onMeetupGone: () => void
  onRefresh: () => Promise<void>
}

export default function MeetupBeheerSheet({ data, meetupId, visible, onBack, onMeetupGone, onRefresh }: Props) {
  const m = data.meetup
  const accepted = data.acceptedParticipants

  // ── Edit velden ──
  const [title, setTitle] = useState(m.title)
  const [description, setDescription] = useState(m.description ?? '')
  const [editDate, setEditDate] = useState(m.date ?? '')
  const [editTime, setEditTime] = useState(m.time ?? '')
  const [maxP, setMaxP] = useState(m.maxParticipants)
  const [locationName, setLocationName] = useState(m.locationName)

  // ── Aanwezigheid ──
  const [attendees, setAttendees] = useState<Set<string>>(new Set(
    accepted.filter(p => p.attended).map(p => p.userId)
  ))

  // ── Bevestigingsdialogen ──
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')

  // ── Pending ──
  const [savePending, setSavePending] = useState(false)
  const [closePending, setClosePending] = useState(false)
  const [removePending, setRemovePending] = useState<string | null>(null)
  const [cancelPending, setCancelPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [attendancePending, setAttendancePending] = useState(false)

  const [toast, setToast] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    setSavePending(true)
    setSaveError(null)
    const res = await updateMeetup(meetupId, {
      title: title.trim(),
      description: description.trim(),
      date: editDate || undefined,
      time: editTime || undefined,
      maxParticipants: maxP,
      locationName: locationName.trim(),
    })
    setSavePending(false)
    if (res.success) {
      await onRefresh()
      showToast('Meetup bijgewerkt ✓')
    } else {
      setSaveError(res.error ?? 'Opslaan mislukt')
    }
  }

  async function handleClose() {
    setClosePending(true)
    await closeMeetup(meetupId)
    setClosePending(false)
    await onRefresh()
    showToast('Inschrijvingen gesloten')
  }

  async function handleRemove(userId: string) {
    setRemovePending(userId)
    await removeParticipant(meetupId, userId)
    setRemovePending(null)
    setRemoveConfirmId(null)
    await onRefresh()
    showToast('Deelnemer verwijderd')
  }

  async function handleAttendance() {
    setAttendancePending(true)
    await confirmAttendance(meetupId, Array.from(attendees))
    setAttendancePending(false)
    await onRefresh()
    showToast('Aanwezigheid opgeslagen ✓')
  }

  async function handleCancel() {
    setCancelPending(true)
    await cancelMeetup(meetupId, cancelReason.trim() || undefined)
    setCancelPending(false)
    onMeetupGone()
  }

  async function handleDelete() {
    setDeletePending(true)
    await deleteMeetup(meetupId)
    setDeletePending(false)
    onMeetupGone()
  }

  // Aanwezigheid sectie alleen tonen na geplande datum
  const meetupPassed = !m.isSpontaneous && m.date && m.time
    ? new Date(`${m.date}T${m.time}`) < new Date()
    : m.isSpontaneous && m.expiresAt
    ? new Date(m.expiresAt) < new Date()
    : false

  const statusLabel: Record<string, string> = {
    open: 'Open', vol: 'Vol', geannuleerd: 'Geannuleerd', gepland: 'Gepland',
  }

  const removeTarget = accepted.find(p => p.userId === removeConfirmId)

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#F4F1E8', zIndex: 10,
      display: 'flex', flexDirection: 'column',
      transform: visible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'transform 0.3s ease-out',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: '#fff', borderBottom: '1px solid #F3F4F6', flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeft size={16} color="#1E2B20" />
        </button>
        <p style={{ ...SYNE, fontSize: 16, fontWeight: 800, color: '#1E2B20', margin: 0, flex: 1, textAlign: 'center' }}>
          Meetup beheren
        </p>
        <div style={{ width: 32 }} />
      </div>

      {/* Scrollbare content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 12, paddingBottom: 32 }}>

        {/* ── Sectie 1: Details aanpassen ── */}
        <div style={SECTION}>
          <p style={SECTION_LABEL}>Details aanpassen</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div>
              <label style={LABEL}>Titel</label>
              <input
                style={INPUT}
                value={title}
                onChange={e => setTitle(e.target.value.slice(0, 60))}
                maxLength={60}
              />
              <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', margin: '2px 0 0' }}>{title.length}/60</p>
            </div>

            <div>
              <label style={LABEL}>Beschrijving</label>
              <textarea
                style={{ ...INPUT, resize: 'none' }}
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, 300))}
              />
              <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', margin: '2px 0 0' }}>{description.length}/300</p>
            </div>

            {!m.isSpontaneous && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={LABEL}>Datum</label>
                  <input type="date" style={INPUT} value={editDate} onChange={e => setEditDate(e.target.value)} />
                </div>
                <div>
                  <label style={LABEL}>Tijd</label>
                  <input type="time" style={INPUT} value={editTime} onChange={e => setEditTime(e.target.value)} />
                </div>
              </div>
            )}

            <div>
              <label style={LABEL}>Max deelnemers</label>
              <input
                type="number"
                style={INPUT}
                min={2}
                max={20}
                value={maxP}
                onChange={e => setMaxP(Math.min(20, Math.max(2, Number(e.target.value))))}
              />
            </div>

            <div>
              <label style={LABEL}>Locatienaam</label>
              <input style={INPUT} value={locationName} onChange={e => setLocationName(e.target.value)} />
            </div>

            {saveError && (
              <p style={{ fontSize: 13, color: '#DC2626', margin: 0 }}>{saveError}</p>
            )}

            <button
              onClick={handleSave}
              disabled={savePending}
              style={{ ...BTN_PRIMARY, opacity: savePending ? 0.6 : 1 }}
            >
              {savePending ? 'Opslaan...' : 'Wijzigingen opslaan'}
            </button>
          </div>
        </div>

        {/* ── Sectie 2: Status ── */}
        <div style={SECTION}>
          <p style={SECTION_LABEL}>Status</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: '#374151' }}>Huidige status</span>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
              background: m.status === 'open' ? '#DCFCE7' : m.status === 'vol' ? '#FEF3C7' : '#FEE2E2',
              color: m.status === 'open' ? '#16A34A' : m.status === 'vol' ? '#D97706' : '#DC2626',
            }}>
              {statusLabel[m.status] ?? m.status}
            </span>
          </div>
          {m.status === 'open' && (
            <button
              onClick={handleClose}
              disabled={closePending}
              style={{ ...BTN_OUTLINE, opacity: closePending ? 0.6 : 1 }}
            >
              {closePending ? 'Bezig...' : 'Sluit inschrijvingen'}
            </button>
          )}
        </div>

        {/* ── Sectie 3: Deelnemers ── */}
        <div style={SECTION}>
          <p style={SECTION_LABEL}>Geaccepteerde deelnemers ({accepted.length})</p>
          {accepted.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Users size={32} color="#D1D5DB" style={{ display: 'block', margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Nog geen deelnemers geaccepteerd</p>
            </div>
          ) : (
            accepted.map((p: ModalParticipant) => (
              <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                </div>
                <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1E2B20', margin: 0 }}>{p.name}</p>
                <button
                  onClick={() => setRemoveConfirmId(p.userId)}
                  disabled={removePending === p.userId}
                  style={{
                    fontSize: 12, fontWeight: 600, color: '#DC2626',
                    background: 'transparent', border: '1px solid #FCA5A5',
                    borderRadius: 8, padding: '4px 10px', cursor: 'pointer',
                  }}
                >
                  Verwijder
                </button>
              </div>
            ))
          )}
        </div>

        {/* ── Sectie 4: Aanwezigheid (alleen na meetup) ── */}
        {meetupPassed && accepted.length > 0 && (
          <div style={SECTION}>
            <p style={SECTION_LABEL}>Aanwezigheid bevestigen</p>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 12px', lineHeight: 1.5 }}>
              Bevestig wie er daadwerkelijk bij was. Dit telt mee voor de betrouwbaarheidsscore.
            </p>
            {accepted.map((p: ModalParticipant) => (
              <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #F9FAFB' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                  <Avatar name={p.name} imageUrl={p.avatarUrl} size="sm" />
                </div>
                <p style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1E2B20', margin: 0 }}>{p.name}</p>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={attendees.has(p.userId)}
                    onChange={e => {
                      const s = new Set(attendees)
                      if (e.target.checked) s.add(p.userId)
                      else s.delete(p.userId)
                      setAttendees(s)
                    }}
                    style={{ accentColor: '#C4F542', width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 13, color: '#374151' }}>Aanwezig</span>
                </label>
              </div>
            ))}
            <button
              onClick={handleAttendance}
              disabled={attendancePending}
              style={{ ...BTN_PRIMARY, marginTop: 12, opacity: attendancePending ? 0.6 : 1 }}
            >
              {attendancePending ? 'Opslaan...' : 'Sla aanwezigheid op'}
            </button>
          </div>
        )}

        {/* ── Sectie 5: Gevaarzone ── */}
        <div style={{ ...SECTION, border: '1.5px solid #FCA5A5' }}>
          <p style={{ ...SECTION_LABEL, color: '#DC2626' }}>⚠️ Gevaarzone</p>
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={m.status === 'geannuleerd'}
            style={{ ...BTN_DANGER, opacity: m.status === 'geannuleerd' ? 0.4 : 1 }}
          >
            Meetup annuleren
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} style={BTN_DANGER}>
            Meetup verwijderen
          </button>
        </div>
      </div>

      {/* ── Bevestigingsdialoog: Verwijder deelnemer ── */}
      {removeConfirmId && removeTarget && (
        <ConfirmOverlay
          title={`${removeTarget.name} verwijderen?`}
          body="De deelnemer krijgt een notificatie dat hij/zij is verwijderd."
          confirmLabel="Ja, verwijder"
          confirmColor="#DC2626"
          loading={removePending === removeConfirmId}
          onConfirm={() => handleRemove(removeConfirmId)}
          onCancel={() => setRemoveConfirmId(null)}
        />
      )}

      {/* ── Bevestigingsdialoog: Annuleren ── */}
      {showCancelConfirm && (
        <div style={OVERLAY_STYLE}>
          <div style={DIALOG_STYLE}>
            <p style={{ ...SYNE, fontSize: 16, fontWeight: 800, color: '#1E2B20', margin: '0 0 4px' }}>
              Meetup annuleren?
            </p>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 14px', lineHeight: 1.5 }}>
              Alle deelnemers en geïnteresseerden krijgen een notificatie.
            </p>
            <label style={LABEL}>Reden (optioneel)</label>
            <textarea
              style={{ ...INPUT, resize: 'none', marginBottom: 14 }}
              rows={2}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Bijv. weersomstandigheden..."
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowCancelConfirm(false)} style={{ ...BTN_OUTLINE, flex: 1, padding: '10px' }}>Terug</button>
              <button
                onClick={handleCancel}
                disabled={cancelPending}
                style={{ flex: 1, background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 700, cursor: cancelPending ? 'not-allowed' : 'pointer', opacity: cancelPending ? 0.6 : 1 }}
              >
                {cancelPending ? 'Bezig...' : 'Bevestig annulering'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bevestigingsdialoog: Verwijderen ── */}
      {showDeleteConfirm && (
        <div style={OVERLAY_STYLE}>
          <div style={DIALOG_STYLE}>
            <p style={{ ...SYNE, fontSize: 16, fontWeight: 800, color: '#1E2B20', margin: '0 0 4px' }}>
              Meetup definitief verwijderen?
            </p>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 6px', lineHeight: 1.5 }}>
              Dit kan niet ongedaan worden gemaakt. Alle data wordt permanent verwijderd.
            </p>
            <p style={{ fontSize: 13, color: '#DC2626', fontWeight: 600, margin: '0 0 10px' }}>
              Type DELETE om te bevestigen
            </p>
            <input
              style={{ ...INPUT, marginBottom: 14 }}
              value={deleteText}
              onChange={e => setDeleteText(e.target.value)}
              placeholder="DELETE"
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteText('') }} style={{ ...BTN_OUTLINE, flex: 1, padding: '10px' }}>Nee</button>
              <button
                onClick={handleDelete}
                disabled={deleteText !== 'DELETE' || deletePending}
                style={{
                  flex: 1, background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10,
                  padding: '10px', fontSize: 14, fontWeight: 700,
                  cursor: deleteText !== 'DELETE' || deletePending ? 'not-allowed' : 'pointer',
                  opacity: deleteText !== 'DELETE' || deletePending ? 0.4 : 1,
                }}
              >
                {deletePending ? 'Verwijderen...' : 'Definitief verwijderen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#1E2B20', color: '#fff', fontSize: 13, fontWeight: 600,
          padding: '10px 20px', borderRadius: 20, whiteSpace: 'nowrap', zIndex: 20,
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

// ─── Herbruikbare bevestigingsoverlay ─────────────────────────────────────────

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, padding: 20,
}
const DIALOG_STYLE: React.CSSProperties = {
  background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 360,
}

function ConfirmOverlay({ title, body, confirmLabel, confirmColor, loading, onConfirm, onCancel }: {
  title: string
  body: string
  confirmLabel: string
  confirmColor: string
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div style={OVERLAY_STYLE}>
      <div style={DIALOG_STYLE}>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1E2B20', margin: '0 0 6px' }}>{title}</p>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 16px', lineHeight: 1.5 }}>{body}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, background: '#F3F4F6', color: '#1E2B20', border: 'none', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Nee
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1, background: confirmColor, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Bezig...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
