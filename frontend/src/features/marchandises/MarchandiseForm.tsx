import { useState, type FormEvent } from 'react'
import type { Marchandise } from './useMarchandises.js'

// Champs scripturables d'une marchandise, mêmes clés que le
// CreateMarchandiseDto côté backend (backend/src/marchandise/marchandise.dto.ts) :
// CouleurPlanning/IDDECHETS en string (BigInt non sérialisable côté JSON).
export type MarchandiseDto = {
  Nom_marchandise: string
  CouleurPlanning: string
  IDDECHETS: string
}

type Props = {
  initial: Marchandise | null
  onSubmit: (dto: MarchandiseDto) => Promise<void>
  onCancel: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
const inputStyle = { padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)' }

// Formulaire de saisie utilisé par la modale de création/modification (voir
// MarchandisesPage.tsx). `initial` vaut null en création, sinon pré-remplit
// les champs avec la ligne cliquée dans le tableau. IDDECHETS n'a pas de
// sélecteur dédié (pas de feature Déchets) — saisi comme identifiant brut.
export function MarchandiseForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<MarchandiseDto>({
    Nom_marchandise: initial?.Nom_marchandise ?? '',
    CouleurPlanning: initial?.CouleurPlanning ?? '',
    IDDECHETS: initial?.IDDECHETS ?? '',
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
        Marchandise
        <input style={inputStyle} value={form.Nom_marchandise} onChange={(e) => setForm({ ...form, Nom_marchandise: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Couleur planning
        <input style={inputStyle} value={form.CouleurPlanning} onChange={(e) => setForm({ ...form, CouleurPlanning: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        ID déchet
        <input style={inputStyle} value={form.IDDECHETS} onChange={(e) => setForm({ ...form, IDDECHETS: e.target.value })} />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
