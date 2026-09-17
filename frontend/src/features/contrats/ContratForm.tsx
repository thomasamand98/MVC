import { useState, type FormEvent } from 'react'
import type { Contrat } from './useContrats.js'
import type { Societe } from '../societes/useSocietes.js'

// Champs scripturables d'un contrat, mêmes clés que le CreateContratDto
// côté backend (backend/src/contrat/contrat.dto.ts) : dates en ISO string,
// IDSOCIETES en string (BigInt non sérialisable côté JSON).
export type ContratDto = {
  Num_contrat: string
  Description_projet: string
  Date_debut: string
  Date_fin: string
  IDSOCIETES: string
}

type Props = {
  initial: Contrat | null
  // Liste des sociétés pour le sélecteur — chargée par ContratsPage et
  // passée en prop plutôt que rechargée ici, pour ne pas refaire un GET
  // /societes à chaque ouverture de la modale.
  societes: Societe[]
  onSubmit: (dto: ContratDto) => Promise<void>
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

// Formulaire de saisie utilisé par la modale de création/modification (voir
// ContratsPage.tsx). `initial` vaut null en création, sinon pré-remplit les
// champs avec la ligne cliquée dans le tableau.
export function ContratForm({ initial, societes, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ContratDto>({
    Num_contrat: initial?.Num_contrat ?? '',
    Description_projet: initial?.Description_projet ?? '',
    Date_debut: toDateInput(initial?.Date_debut),
    Date_fin: toDateInput(initial?.Date_fin),
    IDSOCIETES: initial?.IDSOCIETES ?? '',
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
      <label style={fieldStyle}>
        Numéro
        <input style={inputStyle} value={form.Num_contrat} onChange={(e) => setForm({ ...form, Num_contrat: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Société
        <select style={inputStyle} value={form.IDSOCIETES} onChange={(e) => setForm({ ...form, IDSOCIETES: e.target.value })}>
          <option value="">—</option>
          {societes.map((s) => (
            <option key={s.IDSOCIETES} value={s.IDSOCIETES}>{s.Nom_societe}</option>
          ))}
        </select>
      </label>
      <label style={fieldStyle}>
        Début
        <input type="date" style={inputStyle} value={form.Date_debut} onChange={(e) => setForm({ ...form, Date_debut: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Fin
        <input type="date" style={inputStyle} value={form.Date_fin} onChange={(e) => setForm({ ...form, Date_fin: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Description
        <input style={inputStyle} value={form.Description_projet} onChange={(e) => setForm({ ...form, Description_projet: e.target.value })} />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
