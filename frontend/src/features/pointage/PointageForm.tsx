import { useState, type FormEvent } from 'react'
import type { PointageDetail } from './usePointage.js'
import type { Personnel } from '../personnel/usePersonnel.js'
import type { TypeStatut } from './useTypesStatut.js'
import { useUnsavedForm } from '../../components/unsaved-changes/UnsavedChangesContext.js'

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
  // Statuts (table types_statut) pour le sélecteur Statut — chargés par la
  // page, comme le personnel.
  statuts: TypeStatut[]
  onSubmit: (dto: PointageDto) => Promise<void>
  onCancel: () => void
}


// Convertit une date ISO (renvoyée par l'API) en "AAAA-MM-JJ", format attendu
// par <input type="date">.
function toDateInput(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

// H. début / H. fin : seule l'heure est saisie, la date est celle du
// pointage (Date_application). En base ce sont des instants complets
// (Date_heure_debut / Date_heure_fin) : on affiche leur heure locale
// ("HH:MM") et on les reconstruit à l'enregistrement.
function toClockInput(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// Jour "AAAA-MM-JJ" + heure "HH:MM" (heure locale) → instant ISO. `nextDay` :
// fin le lendemain (travail de nuit).
function toInstant(day: string, time: string, nextDay = false): string {
  if (!day || !time) return ''
  const [y, m, d] = day.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  return new Date(y, m - 1, d + (nextDay ? 1 : 0), h, min).toISOString()
}

// Une fin égale ou antérieure au début tombe le lendemain.
const endsNextDay = (debut: string, fin: string) => Boolean(debut && fin && fin <= debut)

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
// CrudPage avant l'ouverture de la modale.
export function PointageForm({ initial, defaults, personnel, statuts, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<PointageDto>({
    IDPERSONNELS: initial?.IDPERSONNELS ?? '',
    IDType_Statut: initial?.IDType_Statut ?? '',
    Date_application: toDateInput(initial?.Date_application),
    Date_heure_debut: toClockInput(initial?.Date_heure_debut),
    Date_heure_fin: toClockInput(initial?.Date_heure_fin),
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

  async function save() {
    setSubmitting(true)
    try {
      await onSubmit({
        ...form,
        Date_heure_debut: toInstant(form.Date_application, form.Date_heure_debut),
        Date_heure_fin: toInstant(form.Date_application, form.Date_heure_fin, endsNextDay(form.Date_heure_debut, form.Date_heure_fin)),
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Quitter la fiche modifiée demande « Enregistrer / Annuler les
  // modifications » (voir components/unsaved-changes/).
  const { formRef, confirmLeave } = useUnsavedForm(form, save)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void save()
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="form">
      <label className="field">
        Date
        <input
          type="date"
         
          // Nécessaire pour dater les heures de début et de fin.
          required={Boolean(form.Date_heure_debut || form.Date_heure_fin)}
          value={form.Date_application}
          onChange={(e) => setForm({ ...form, Date_application: e.target.value })}
        />
      </label>
      <label className="field">
        Personnel
        <select value={form.IDPERSONNELS} onChange={(e) => setForm({ ...form, IDPERSONNELS: e.target.value })}>
          <option value="">—</option>
          {personnel.map((p) => (
            <option key={p.IDPERSONNELS} value={p.IDPERSONNELS}>{[p.Nom_Personnel, p.Prenom_Personnel].filter(Boolean).join(' ')}</option>
          ))}
        </select>
      </label>
      <label className="field">
        H. début
        <input
          type="time"
         
          value={form.Date_heure_debut}
          onChange={(e) => setForm({ ...form, Date_heure_debut: e.target.value })}
        />
      </label>
      <label className="field">
        <span>
          H. fin
          {endsNextDay(form.Date_heure_debut, form.Date_heure_fin) && <span style={{ color: 'var(--accent)', fontWeight: 600 }}> (le lendemain)</span>}
        </span>
        <input
          type="time"
         
          value={form.Date_heure_fin}
          onChange={(e) => setForm({ ...form, Date_heure_fin: e.target.value })}
        />
      </label>
      <label className="field">
        H. coupure
        <input
          type="time"
         
          value={toTimeInput(form.Heure_coupure)}
          onChange={(e) => setForm({ ...form, Heure_coupure: fromTimeInput(e.target.value) })}
        />
      </label>
      <label className="field">
        H. nuit
        <input
          type="time"
         
          value={toTimeInput(form.Heure_nuit)}
          onChange={(e) => setForm({ ...form, Heure_nuit: fromTimeInput(e.target.value) })}
        />
      </label>
      <label className="field">
        H. liaison
        <input
          type="time"
         
          value={toTimeInput(form.Heure_liaison)}
          onChange={(e) => setForm({ ...form, Heure_liaison: fromTimeInput(e.target.value) })}
        />
      </label>
      <label className="field">
        H. standby
        <input
          type="time"
         
          value={toTimeInput(form.Heure_Stanby)}
          onChange={(e) => setForm({ ...form, Heure_Stanby: fromTimeInput(e.target.value) || '1970-01-01T00:00:00.000Z' })}
        />
      </label>
      <label className="field">
        Début pause
        <input
          type="time"
         
          value={toTimeInput(form.Debut_pause)}
          onChange={(e) => setForm({ ...form, Debut_pause: fromTimeInput(e.target.value) })}
        />
      </label>
      <label className="field">
        Fin pause
        <input
          type="time"
         
          value={toTimeInput(form.Fin_Pause)}
          onChange={(e) => setForm({ ...form, Fin_Pause: fromTimeInput(e.target.value) })}
        />
      </label>
      <label className="field">
        Statut
        <select value={form.IDType_Statut} onChange={(e) => setForm({ ...form, IDType_Statut: e.target.value })}>
          <option value="">{statuts.length === 0 ? 'Aucun statut (table types_statut vide)' : '—'}</option>
          {statuts
            // Les statuts archivés ne sont plus proposés, sauf celui déjà
            // porté par ce pointage (sinon il serait perdu à l'enregistrement).
            .filter((s) => s.Archive !== 1 || s.IDType_Statut === form.IDType_Statut)
            .map((s) => (
              <option key={s.IDType_Statut} value={s.IDType_Statut}>
                {s.Libelle_generique || `Statut ${s.IDType_Statut}`}
                {s.Archive === 1 ? ' (archivé)' : ''}
              </option>
            ))}
        </select>
      </label>
      <label className="field">
        Nuitée
        <select value={form.Nuitee} onChange={(e) => setForm({ ...form, Nuitee: Number(e.target.value) })}>
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
      <label className="field">
        Remarque
        <textarea
          rows={3}
          value={form.Remarque}
          onChange={(e) => setForm({ ...form, Remarque: e.target.value })}
        />
      </label>
      {/* Boutons en bas, après tous les champs. */}
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => void confirmLeave(onCancel)}>Annuler</button>
        <button type="submit" className="btn primary" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
