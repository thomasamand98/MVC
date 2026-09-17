import { useState, type FormEvent } from 'react'
import type { Point } from './usePoints.js'
import type { Societe } from '../societes/useSocietes.js'

// Champs scripturables d'un point, mêmes clés que le CreatePointDto côté
// backend (backend/src/point/point.dto.ts) : IDADRESSES/IDSOCIETES en
// string (BigInt non sérialisable côté JSON).
export type PointDto = {
  Libelle: string
  Nom_societe: string
  Telephone: string
  IDADRESSES: string
  IDSOCIETES: string
}

type Props = {
  initial: Point | null
  // Liste des sociétés pour le sélecteur — chargée par PointsPage et
  // passée en prop plutôt que rechargée ici, pour ne pas refaire un GET
  // /societes à chaque ouverture de la modale.
  societes: Societe[]
  onSubmit: (dto: PointDto) => Promise<void>
  onCancel: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
const inputStyle = { padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)' }

// Formulaire de saisie utilisé par la modale de création/modification (voir
// PointsPage.tsx). `initial` vaut null en création, sinon pré-remplit les
// champs avec la ligne cliquée dans le tableau. IDADRESSES n'a pas de
// sélecteur dédié (pas de feature Adresses) — saisi comme identifiant brut.
export function PointForm({ initial, societes, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<PointDto>({
    Libelle: initial?.Libelle ?? '',
    Nom_societe: initial?.Nom_societe ?? '',
    Telephone: initial?.Telephone ?? '',
    IDADRESSES: initial?.IDADRESSES ?? '',
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
        Nom
        <input style={inputStyle} value={form.Libelle} onChange={(e) => setForm({ ...form, Libelle: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Société (lien)
        <select style={inputStyle} value={form.IDSOCIETES} onChange={(e) => setForm({ ...form, IDSOCIETES: e.target.value })}>
          <option value="">—</option>
          {societes.map((s) => (
            <option key={s.IDSOCIETES} value={s.IDSOCIETES}>{s.Nom_societe}</option>
          ))}
        </select>
      </label>
      <label style={fieldStyle}>
        Société (texte libre)
        <input style={inputStyle} value={form.Nom_societe} onChange={(e) => setForm({ ...form, Nom_societe: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Téléphone
        <input style={inputStyle} value={form.Telephone} onChange={(e) => setForm({ ...form, Telephone: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        ID adresse
        <input style={inputStyle} value={form.IDADRESSES} onChange={(e) => setForm({ ...form, IDADRESSES: e.target.value })} />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
