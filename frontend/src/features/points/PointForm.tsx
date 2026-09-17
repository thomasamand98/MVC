import { useState, type FormEvent } from 'react'
import type { PointDetail } from './usePoints.js'
import type { Societe } from '../societes/useSocietes.js'

// Champs scripturables d'un point, mêmes clés que le CreatePointDto côté
// backend (backend/src/point/point.dto.ts) : IDADRESSES/IDSOCIETES/
// IDCONTACTS_DEFAUTS en string (BigInt non sérialisable côté JSON). Archive
// est un code 0/1 côté vrai modèle Prisma (pas un booléen).
export type PointDto = {
  Libelle: string
  Nom_societe: string
  Telephone: string
  IDADRESSES: string
  IDSOCIETES: string
  Archive: number
  Lien_googleMap: string
  Instruction: string
  IDCONTACTS_DEFAUTS: string
}

type Props = {
  initial: PointDetail | null
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
// PointsPage.tsx). `initial` vaut null en création, sinon la fiche complète
// du point (GET /points/:id, voir usePoints.ts) chargée par CrudPage avant
// l'ouverture de la modale. IDADRESSES/IDCONTACTS_DEFAUTS n'ont pas de
// sélecteur dédié (pas de feature Adresses) — saisis comme identifiants
// bruts.
export function PointForm({ initial, societes, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<PointDto>({
    Libelle: initial?.Libelle ?? '',
    Nom_societe: initial?.Nom_societe ?? '',
    Telephone: initial?.Telephone ?? '',
    IDADRESSES: initial?.IDADRESSES ?? '',
    IDSOCIETES: initial?.IDSOCIETES ?? '',
    Archive: initial?.Archive ?? 0,
    Lien_googleMap: initial?.Lien_googleMap ?? '',
    Instruction: initial?.Instruction ?? '',
    IDCONTACTS_DEFAUTS: initial?.IDCONTACTS_DEFAUTS ?? '',
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
        Archivé
        <select style={inputStyle} value={form.Archive} onChange={(e) => setForm({ ...form, Archive: Number(e.target.value) })}>
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
      <label style={fieldStyle}>
        ID adresse
        <input style={inputStyle} value={form.IDADRESSES} onChange={(e) => setForm({ ...form, IDADRESSES: e.target.value })} />
      </label>
      {initial?.Adresse && (
        <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted, gray)' }}>
          Adresse actuelle : {[initial.Adresse.Adresse1, initial.Adresse.CP, initial.Adresse.Localite].filter(Boolean).join(', ') || '—'}
        </p>
      )}
      <label style={fieldStyle}>
        Lien Google Maps
        <input style={inputStyle} value={form.Lien_googleMap} onChange={(e) => setForm({ ...form, Lien_googleMap: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        ID contact par défaut
        <input
          style={inputStyle}
          value={form.IDCONTACTS_DEFAUTS}
          onChange={(e) => setForm({ ...form, IDCONTACTS_DEFAUTS: e.target.value })}
        />
      </label>
      {initial?.ContactDefauts && (
        <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted, gray)' }}>
          Contact par défaut actuel : {[initial.ContactDefauts.Nom_contact, initial.ContactDefauts.Prenom_contact].filter(Boolean).join(' ') || '—'}
        </p>
      )}
      <label style={fieldStyle}>
        Instruction
        <textarea
          style={{ ...inputStyle, resize: 'vertical' as const }}
          rows={3}
          value={form.Instruction}
          onChange={(e) => setForm({ ...form, Instruction: e.target.value })}
        />
      </label>
      {initial && initial.PointContacts.length > 0 && (
        <div style={fieldStyle}>
          <span>Contacts liés</span>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {initial.PointContacts.map((pc, i) => (
              <li key={i}>
                {[pc.Contact?.Nom_contact, pc.Contact?.Prenom_contact].filter(Boolean).join(' ') || '—'}
                {pc.Lien ? ` (${pc.Lien})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
