import { useState, type FormEvent } from 'react'
import '../../components/PageActions.css'
import type { PointageDetail } from './usePointage.js'
import type { Personnel } from '../personnel/usePersonnel.js'

// Champs scripturables d'un pointage, mêmes clés que le CreatePointageDto
// côté backend (backend/src/pointage/pointage.dto.ts) : IDPERSONNELS/
// IDType_Statut en string (BigInt non sérialisable côté JSON), dates/heures
// en string. Nuitee est un code 0/1 côté vrai modèle Prisma (pas un
// booléen).
export type PointageDto = {
  IDPERSONNELS: string
  IDType_Statut: string
  Date_application: string
  Date_heure_debut: string
  Date_heure_fin: string
  Heure_coupure: string
  Heure_liaison: string
  Heure_nuit: string
  Heure_Stanby: string
  Debut_pause: string
  Fin_Pause: string
  Nuitee: number
  Remarque: string
}

type Props = {
  initial: PointageDetail | null
  // Valeurs préremplies en création (projection depuis une seule ligne,
  // voir components/projection/relations.ts) — ignorées en modification.
  defaults?: Partial<PointageDto>
  // Liste du personnel pour le sélecteur — chargée par PointagePage et
  // passée en prop plutôt que rechargée ici, pour ne pas refaire un GET
  // /personnel à chaque ouverture de la modale.
  personnel: Personnel[]
  onSubmit: (dto: PointageDto) => Promise<void>
  onCancel: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
const inputStyle = { padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)' }

// Convertit une date ISO (renvoyée par l'API) en "AAAA-MM-JJ", format attendu
// par <input type="date">.
function toDateInput(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

// Convertit un horodatage ISO en "AAAA-MM-JJThh:mm", format attendu par
// <input type="datetime-local">.
function toDateTimeInput(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 16)
}

// Les champs Heure_* sont des TIME côté Prisma (renvoyés comme un datetime
// sur une date arbitraire) — <input type="time"> ne travaille qu'en "HH:MM",
// donc conversion dans les deux sens autour d'une date fixe arbitraire.
function toTimeInput(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(11, 16)
}

function fromTimeInput(value: string): string {
  return value ? `1970-01-01T${value}:00.000Z` : ''
}

// Formulaire de saisie utilisé par la modale de création/modification (voir
// PointagePage.tsx). `initial` vaut null en création, sinon la fiche
// complète du pointage (GET /pointage/:id, voir usePointage.ts) chargée par
// CrudPage avant l'ouverture de la modale. IDType_Statut n'a pas de
// sélecteur dédié (pas de feature Types de statut) — saisi comme
// identifiant brut.
export function PointageForm({ initial, defaults, personnel, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<PointageDto>({
    IDPERSONNELS: initial?.IDPERSONNELS ?? '',
    IDType_Statut: initial?.IDType_Statut ?? '',
    Date_application: toDateInput(initial?.Date_application),
    Date_heure_debut: toDateTimeInput(initial?.Date_heure_debut),
    Date_heure_fin: toDateTimeInput(initial?.Date_heure_fin),
    Heure_coupure: fromTimeInput(toTimeInput(initial?.Heure_coupure)),
    Heure_liaison: fromTimeInput(toTimeInput(initial?.Heure_liaison)),
    Heure_nuit: fromTimeInput(toTimeInput(initial?.Heure_nuit)),
    Heure_Stanby: fromTimeInput(toTimeInput(initial?.Heure_Stanby)) || '1970-01-01T00:00:00.000Z',
    Debut_pause: fromTimeInput(toTimeInput(initial?.Debut_pause)),
    Fin_Pause: fromTimeInput(toTimeInput(initial?.Fin_Pause)),
    Nuitee: initial?.Nuitee ?? 0,
    Remarque: initial?.Remarque ?? '',
    ...(initial ? {} : defaults),
  })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button type="button" className="page-actions-button secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="page-actions-button primary" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
      <label style={fieldStyle}>
        Date
        <input
          type="date"
          style={inputStyle}
          value={form.Date_application}
          onChange={(e) => setForm({ ...form, Date_application: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Personnel
        <select style={inputStyle} value={form.IDPERSONNELS} onChange={(e) => setForm({ ...form, IDPERSONNELS: e.target.value })}>
          <option value="">—</option>
          {personnel.map((p) => (
            <option key={p.IDPERSONNELS} value={p.IDPERSONNELS}>{[p.Nom_Personnel, p.Prenom_Personnel].filter(Boolean).join(' ')}</option>
          ))}
        </select>
      </label>
      <label style={fieldStyle}>
        H. début
        <input
          type="datetime-local"
          style={inputStyle}
          value={form.Date_heure_debut}
          onChange={(e) => setForm({ ...form, Date_heure_debut: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        H. fin
        <input
          type="datetime-local"
          style={inputStyle}
          value={form.Date_heure_fin}
          onChange={(e) => setForm({ ...form, Date_heure_fin: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        H. coupure
        <input
          type="time"
          style={inputStyle}
          value={toTimeInput(form.Heure_coupure)}
          onChange={(e) => setForm({ ...form, Heure_coupure: fromTimeInput(e.target.value) })}
        />
      </label>
      <label style={fieldStyle}>
        H. nuit
        <input
          type="time"
          style={inputStyle}
          value={toTimeInput(form.Heure_nuit)}
          onChange={(e) => setForm({ ...form, Heure_nuit: fromTimeInput(e.target.value) })}
        />
      </label>
      <label style={fieldStyle}>
        H. liaison
        <input
          type="time"
          style={inputStyle}
          value={toTimeInput(form.Heure_liaison)}
          onChange={(e) => setForm({ ...form, Heure_liaison: fromTimeInput(e.target.value) })}
        />
      </label>
      <label style={fieldStyle}>
        H. standby
        <input
          type="time"
          style={inputStyle}
          value={toTimeInput(form.Heure_Stanby)}
          onChange={(e) => setForm({ ...form, Heure_Stanby: fromTimeInput(e.target.value) || '1970-01-01T00:00:00.000Z' })}
        />
      </label>
      <label style={fieldStyle}>
        Début pause
        <input
          type="time"
          style={inputStyle}
          value={toTimeInput(form.Debut_pause)}
          onChange={(e) => setForm({ ...form, Debut_pause: fromTimeInput(e.target.value) })}
        />
      </label>
      <label style={fieldStyle}>
        Fin pause
        <input
          type="time"
          style={inputStyle}
          value={toTimeInput(form.Fin_Pause)}
          onChange={(e) => setForm({ ...form, Fin_Pause: fromTimeInput(e.target.value) })}
        />
      </label>
      <label style={fieldStyle}>
        ID type de statut
        <input style={inputStyle} value={form.IDType_Statut} onChange={(e) => setForm({ ...form, IDType_Statut: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Nuitée
        <select style={inputStyle} value={form.Nuitee} onChange={(e) => setForm({ ...form, Nuitee: Number(e.target.value) })}>
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
      <label style={fieldStyle}>
        Remarque
        <textarea
          style={{ ...inputStyle, resize: 'vertical' as const }}
          rows={3}
          value={form.Remarque}
          onChange={(e) => setForm({ ...form, Remarque: e.target.value })}
        />
      </label>
    </form>
  )
}
