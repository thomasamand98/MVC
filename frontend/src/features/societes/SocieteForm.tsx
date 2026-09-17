import { useState, type FormEvent } from 'react'
import type { SocieteDetail } from './useSocietes.js'

// Champs scripturables d'une société, mêmes clés que le CreateSocieteDto
// côté backend (backend/src/societe/societe.dto.ts). Prospect/Archive sont
// des codes 0/1 côté vrai modèle Prisma (pas des booléens).
export type SocieteDto = {
  Nom_societe: string
  Denomination: string
  TVA: string
  Activite: string
  Site_web: string
  Note: string
  IDADRESSES: string
  IDCLIENTS: string
  IDFOURNISSEURS: string
  Prospect: number
  Archive: number
}

type Props = {
  initial: SocieteDetail | null
  onSubmit: (dto: SocieteDto) => Promise<void>
  onCancel: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
const inputStyle = { padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)' }

// Formulaire de saisie utilisé par la modale de création/modification (voir
// SocietesPage.tsx). `initial` vaut null en création, sinon la fiche
// complète de la société (GET /societes/:id, voir useSocietes.ts) chargée
// par CrudPage avant l'ouverture de la modale.
export function SocieteForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<SocieteDto>({
    Nom_societe: initial?.Nom_societe ?? '',
    Denomination: initial?.Denomination ?? '',
    TVA: initial?.TVA ?? '',
    Activite: initial?.Activite ?? '',
    Site_web: initial?.Site_web ?? '',
    Note: initial?.Note ?? '',
    IDADRESSES: initial?.IDADRESSES ?? '',
    IDCLIENTS: initial?.IDCLIENTS ?? '',
    IDFOURNISSEURS: initial?.IDFOURNISSEURS ?? '',
    Prospect: initial?.Prospect ?? 0,
    Archive: initial?.Archive ?? 0,
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
      <label style={fieldStyle}>
        Prospect
        <select style={inputStyle} value={form.Prospect} onChange={(e) => setForm({ ...form, Prospect: Number(e.target.value) })}>
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
      <label style={fieldStyle}>
        Archivée
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
        ID client
        <input style={inputStyle} value={form.IDCLIENTS} onChange={(e) => setForm({ ...form, IDCLIENTS: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        ID fournisseur
        <input style={inputStyle} value={form.IDFOURNISSEURS} onChange={(e) => setForm({ ...form, IDFOURNISSEURS: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Note
        <textarea
          style={{ ...inputStyle, resize: 'vertical' as const }}
          rows={3}
          value={form.Note}
          onChange={(e) => setForm({ ...form, Note: e.target.value })}
        />
      </label>
      {initial && initial.SocieteContacts.length > 0 && (
        <div style={fieldStyle}>
          <span>Contacts liés</span>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {initial.SocieteContacts.map((sc, i) => (
              <li key={i}>
                {[sc.Contact?.Nom_contact, sc.Contact?.Prenom_contact].filter(Boolean).join(' ') || '—'}
                {sc.Fonction_contact ? ` (${sc.Fonction_contact})` : ''}
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
