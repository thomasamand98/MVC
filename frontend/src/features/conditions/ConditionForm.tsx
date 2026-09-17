import { useState, type FormEvent } from 'react'
import type { Condition } from './useConditions.js'

// Champs scripturables d'une condition d'exécution, mêmes clés que le
// CreateConditionDto côté backend (backend/src/condition/condition.dto.ts).
// Type_Prestation/CMR_or_FDR sont des codes numériques côté vrai modèle
// Prisma (pas de texte libre) — voir colums.ts pour l'affichage Oui/Non.
export type ConditionDto = {
  Type_Prestation: number
  CMR_or_FDR: number
  Libelle: string
}

type Props = {
  initial: Condition | null
  onSubmit: (dto: ConditionDto) => Promise<void>
  onCancel: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
const inputStyle = { padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)' }

// Formulaire de saisie utilisé par la modale de création/modification (voir
// ConditionsPage.tsx). `initial` vaut null en création, sinon pré-remplit
// les champs avec la ligne cliquée dans le tableau.
export function ConditionForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ConditionDto>({
    Type_Prestation: initial?.Type_Prestation ?? 0,
    CMR_or_FDR: initial?.CMR_or_FDR ?? 0,
    Libelle: initial?.Libelle ?? '',
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
        Libellé
        <input style={inputStyle} value={form.Libelle} onChange={(e) => setForm({ ...form, Libelle: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Type de prestation
        <input
          type="number"
          style={inputStyle}
          value={form.Type_Prestation}
          onChange={(e) => setForm({ ...form, Type_Prestation: Number(e.target.value) })}
        />
      </label>
      <label style={fieldStyle}>
        CMR / FDR
        <select
          style={inputStyle}
          value={form.CMR_or_FDR}
          onChange={(e) => setForm({ ...form, CMR_or_FDR: Number(e.target.value) })}
        >
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
