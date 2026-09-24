import { useState, type FormEvent } from 'react'
import '../../components/PageActions.css'
import type { VehiculeDetail } from './useVehicules.js'
import type { Societe } from '../societes/useSocietes.js'

// Champs scripturables d'un véhicule, mêmes clés que le CreateVehiculeDto
// côté backend (backend/src/vehicule/vehicule.dto.ts) : IDSOCIETES en string
// (BigInt non sérialisable côté JSON), dates en ISO string. Type est un code
// numérique côté vrai modèle Prisma (pas de texte libre). Avec_compresseur
// est un code 0/1 (pas un booléen).
export type VehiculeDto = {
  Type: number
  Marque: string
  Modele: string
  Num_police_assurance: string
  Num_immat: string
  Num_chassis: string
  Date_validite_assurance: string
  Num_licence_transport: string
  Date_validite_licence: string
  Date_modification_licence: string
  Date_inspection_auto: string
  Date_radiation_immatriculation: string
  Date_vente: string
  IDSOCIETES: string
  Date_premiere_mise_en_circulation: string
  Date_validite_tachygeaphe: string
  Avec_compresseur: number
}

type Props = {
  initial: VehiculeDetail | null
  // Valeurs préremplies en création (projection depuis une seule ligne,
  // voir components/projection/relations.ts) — ignorées en modification.
  defaults?: Partial<VehiculeDto>
  // Liste des sociétés pour le sélecteur — chargée par VehiculesPage et
  // passée en prop plutôt que rechargée ici, pour ne pas refaire un GET
  // /societes à chaque ouverture de la modale.
  societes: Societe[]
  onSubmit: (dto: VehiculeDto) => Promise<void>
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
// VehiculesPage.tsx). `initial` vaut null en création, sinon la fiche
// complète du véhicule (GET /vehicules/:id, voir useVehicules.ts) chargée
// par CrudPage avant l'ouverture de la modale.
export function VehiculeForm({ initial, defaults, societes, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<VehiculeDto>({
    Type: initial?.Type ?? 0,
    Marque: initial?.Marque ?? '',
    Modele: initial?.Modele ?? '',
    Num_police_assurance: initial?.Num_police_assurance ?? '',
    Num_immat: initial?.Num_immat ?? '',
    Num_chassis: initial?.Num_chassis ?? '',
    Date_validite_assurance: toDateInput(initial?.Date_validite_assurance),
    Num_licence_transport: initial?.Num_licence_transport ?? '',
    Date_validite_licence: toDateInput(initial?.Date_validite_licence),
    Date_modification_licence: toDateInput(initial?.Date_modification_licence),
    Date_inspection_auto: toDateInput(initial?.Date_inspection_auto),
    Date_radiation_immatriculation: toDateInput(initial?.Date_radiation_immatriculation),
    Date_vente: toDateInput(initial?.Date_vente),
    IDSOCIETES: initial?.IDSOCIETES ?? '',
    Date_premiere_mise_en_circulation: toDateInput(initial?.Date_premiere_mise_en_circulation),
    Date_validite_tachygeaphe: toDateInput(initial?.Date_validite_tachygeaphe),
    Avec_compresseur: initial?.Avec_compresseur ?? 0,
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
        N° d'immatriculation
        <input style={inputStyle} value={form.Num_immat} onChange={(e) => setForm({ ...form, Num_immat: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Type
        <input type="number" style={inputStyle} value={form.Type} onChange={(e) => setForm({ ...form, Type: Number(e.target.value) })} />
      </label>
      <label style={fieldStyle}>
        Marque
        <input style={inputStyle} value={form.Marque} onChange={(e) => setForm({ ...form, Marque: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Modèle
        <input style={inputStyle} value={form.Modele} onChange={(e) => setForm({ ...form, Modele: e.target.value })} />
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
        N° police d'assurance
        <input
          style={inputStyle}
          value={form.Num_police_assurance}
          onChange={(e) => setForm({ ...form, Num_police_assurance: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Validité assurance
        <input
          type="date"
          style={inputStyle}
          value={form.Date_validite_assurance}
          onChange={(e) => setForm({ ...form, Date_validite_assurance: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        N° châssis
        <input style={inputStyle} value={form.Num_chassis} onChange={(e) => setForm({ ...form, Num_chassis: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        N° licence transport
        <input
          style={inputStyle}
          value={form.Num_licence_transport}
          onChange={(e) => setForm({ ...form, Num_licence_transport: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Validité licence
        <input
          type="date"
          style={inputStyle}
          value={form.Date_validite_licence}
          onChange={(e) => setForm({ ...form, Date_validite_licence: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Modification licence
        <input
          type="date"
          style={inputStyle}
          value={form.Date_modification_licence}
          onChange={(e) => setForm({ ...form, Date_modification_licence: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Inspection auto
        <input
          type="date"
          style={inputStyle}
          value={form.Date_inspection_auto}
          onChange={(e) => setForm({ ...form, Date_inspection_auto: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Validité tachygraphe
        <input
          type="date"
          style={inputStyle}
          value={form.Date_validite_tachygeaphe}
          onChange={(e) => setForm({ ...form, Date_validite_tachygeaphe: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Date radiation immatriculation
        <input
          type="date"
          style={inputStyle}
          value={form.Date_radiation_immatriculation}
          onChange={(e) => setForm({ ...form, Date_radiation_immatriculation: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Date de vente
        <input type="date" style={inputStyle} value={form.Date_vente} onChange={(e) => setForm({ ...form, Date_vente: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        1ère mise en circulation
        <input
          type="date"
          style={inputStyle}
          value={form.Date_premiere_mise_en_circulation}
          onChange={(e) => setForm({ ...form, Date_premiere_mise_en_circulation: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Avec compresseur
        <select
          style={inputStyle}
          value={form.Avec_compresseur}
          onChange={(e) => setForm({ ...form, Avec_compresseur: Number(e.target.value) })}
        >
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
    </form>
  )
}
