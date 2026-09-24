import { useState, type FormEvent } from 'react'
import '../../components/PageActions.css'
import type { Chauffeur } from './useChauffeurs.js'
import type { Societe } from '../societes/useSocietes.js'

// Champs scripturables d'un chauffeur, mêmes clés que le
// CreateChauffeurDto côté backend (backend/src/chauffeur/chauffeur.dto.ts) :
// IDPERSONNELS/IDSOCIETES en string (BigInt non sérialisable côté JSON).
// Archive est un code 0/1 côté vrai modèle Prisma (pas un booléen).
export type ChauffeurDto = {
  Nom_chauffeur: string
  Telephone: string
  Categorie: string
  Archive: number
  IDPERSONNELS: string
  IDSOCIETES: string
}

type Props = {
  initial: Chauffeur | null
  // Valeurs préremplies en création (projection depuis une seule ligne,
  // voir components/projection/relations.ts) — ignorées en modification.
  defaults?: Partial<ChauffeurDto>
  // Liste des sociétés pour le sélecteur — chargée par ChauffeursPage et
  // passée en prop plutôt que rechargée ici, pour ne pas refaire un GET
  // /societes à chaque ouverture de la modale.
  societes: Societe[]
  onSubmit: (dto: ChauffeurDto) => Promise<void>
  onCancel: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
const inputStyle = { padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)' }

// Formulaire de saisie utilisé par la modale de création/modification (voir
// ChauffeursPage.tsx). `initial` vaut null en création, sinon pré-remplit
// les champs avec la ligne cliquée dans le tableau. IDPERSONNELS n'a pas de
// sélecteur dédié (pas de feature Personnel) — saisi comme identifiant brut.
export function ChauffeurForm({ initial, defaults, societes, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ChauffeurDto>({
    Nom_chauffeur: initial?.Nom_chauffeur ?? '',
    Telephone: initial?.Telephone ?? '',
    Categorie: initial?.Categorie ?? '',
    Archive: initial?.Archive ?? 0,
    IDPERSONNELS: initial?.IDPERSONNELS ?? '',
    IDSOCIETES: initial?.IDSOCIETES ?? '',
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
        Chauffeur
        <input style={inputStyle} value={form.Nom_chauffeur} onChange={(e) => setForm({ ...form, Nom_chauffeur: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Catégorie
        <input style={inputStyle} value={form.Categorie} onChange={(e) => setForm({ ...form, Categorie: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Téléphone
        <input style={inputStyle} value={form.Telephone} onChange={(e) => setForm({ ...form, Telephone: e.target.value })} />
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
        ID personnel (lien)
        <input style={inputStyle} value={form.IDPERSONNELS} onChange={(e) => setForm({ ...form, IDPERSONNELS: e.target.value })} />
      </label>
      {initial?.Personnel && (
        <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted, gray)' }}>
          Personnel actuel : {[initial.Personnel.Nom_Personnel, initial.Personnel.Prenom_Personnel].filter(Boolean).join(' ') || '—'}
        </p>
      )}
      <label style={fieldStyle}>
        Archivé
        <select style={inputStyle} value={form.Archive} onChange={(e) => setForm({ ...form, Archive: Number(e.target.value) })}>
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
    </form>
  )
}
