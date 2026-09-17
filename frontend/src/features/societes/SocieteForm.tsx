import { useState, type FormEvent } from 'react'
import type { Societe } from './useSocietes.js'

// Champs scripturables d'une société, mêmes clés que le CreateSocieteDto
// côté backend (backend/src/societe/societe.dto.ts).
export type SocieteDto = {
  Nom_societe: string
  Denomination: string
  TVA: string
  Activite: string
  Site_web: string
}

type Props = {
  initial: Societe | null
  onSubmit: (dto: SocieteDto) => Promise<void>
  onCancel: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
const inputStyle = { padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)' }

// Formulaire de saisie utilisé par la modale de création/modification (voir
// SocietesPage.tsx). `initial` vaut null en création, sinon pré-remplit les
// champs avec la ligne cliquée dans le tableau.
export function SocieteForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<SocieteDto>({
    Nom_societe: initial?.Nom_societe ?? '',
    Denomination: initial?.Denomination ?? '',
    TVA: initial?.TVA ?? '',
    Activite: initial?.Activite ?? '',
    Site_web: initial?.Site_web ?? '',
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
        Nom
        <input style={inputStyle} value={form.Nom_societe} onChange={(e) => setForm({ ...form, Nom_societe: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Dénomination
        <input style={inputStyle} value={form.Denomination} onChange={(e) => setForm({ ...form, Denomination: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        N° TVA
        <input style={inputStyle} value={form.TVA} onChange={(e) => setForm({ ...form, TVA: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Activité
        <input style={inputStyle} value={form.Activite} onChange={(e) => setForm({ ...form, Activite: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Site web
        <input style={inputStyle} value={form.Site_web} onChange={(e) => setForm({ ...form, Site_web: e.target.value })} />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
