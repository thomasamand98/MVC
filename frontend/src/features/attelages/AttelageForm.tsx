import { useState, type FormEvent } from 'react'
import type { Attelage } from './useAttelages.js'
import type { Chauffeur } from '../chauffeurs/useChauffeurs.js'
import type { Vehicule } from '../vehicules/useVehicules.js'

// Champs scripturables d'un attelage, mêmes clés que le CreateAttelageDto
// côté backend (backend/src/attelage/attelage.dto.ts) : IDCHAUFFEUR/
// IDTRACTEUR/IDREMORQUE/IDPERSONNELS en string (BigInt non sérialisable côté
// JSON), Date_debut/Date_fin en ISO string.
export type AttelageDto = {
  IDCHAUFFEUR: string
  IDTRACTEUR: string
  IDREMORQUE: string
  IDPERSONNELS: string
  Date_debut: string
  Date_fin: string
}

type Props = {
  initial: Attelage | null
  // Listes chargées par AttelagesPage et passées en props pour les
  // sélecteurs Chauffeur/Tracteur/Remorque — évite de les recharger à
  // chaque ouverture de la modale.
  chauffeurs: Chauffeur[]
  vehicules: Vehicule[]
  onSubmit: (dto: AttelageDto) => Promise<void>
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
// AttelagesPage.tsx). `initial` vaut null en création, sinon pré-remplit les
// champs avec la ligne cliquée dans le tableau. IDPERSONNELS n'a pas de
// sélecteur dédié ici — saisi comme identifiant brut.
export function AttelageForm({ initial, chauffeurs, vehicules, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<AttelageDto>({
    IDCHAUFFEUR: initial?.IDCHAUFFEUR ?? '',
    IDTRACTEUR: initial?.IDTRACTEUR ?? '',
    IDREMORQUE: initial?.IDREMORQUE ?? '',
    IDPERSONNELS: initial?.IDPERSONNELS ?? '',
    Date_debut: toDateInput(initial?.Date_debut),
    Date_fin: toDateInput(initial?.Date_fin),
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
        Chauffeur
        <select style={inputStyle} value={form.IDCHAUFFEUR} onChange={(e) => setForm({ ...form, IDCHAUFFEUR: e.target.value })}>
          <option value="">—</option>
          {chauffeurs.map((c) => (
            <option key={c.IDCHAUFFEURS} value={c.IDCHAUFFEURS}>{c.Nom_chauffeur}</option>
          ))}
        </select>
      </label>
      <label style={fieldStyle}>
        Tracteur
        <select style={inputStyle} value={form.IDTRACTEUR} onChange={(e) => setForm({ ...form, IDTRACTEUR: e.target.value })}>
          <option value="">—</option>
          {vehicules.map((v) => (
            <option key={v.IDVEHICULES} value={v.IDVEHICULES}>{[v.Marque, v.Modele, v.Num_immat].filter(Boolean).join(' ')}</option>
          ))}
        </select>
      </label>
      <label style={fieldStyle}>
        Remorque
        <select style={inputStyle} value={form.IDREMORQUE} onChange={(e) => setForm({ ...form, IDREMORQUE: e.target.value })}>
          <option value="">—</option>
          {vehicules.map((v) => (
            <option key={v.IDVEHICULES} value={v.IDVEHICULES}>{[v.Marque, v.Modele, v.Num_immat].filter(Boolean).join(' ')}</option>
          ))}
        </select>
      </label>
      <label style={fieldStyle}>
        ID personnel
        <input style={inputStyle} value={form.IDPERSONNELS} onChange={(e) => setForm({ ...form, IDPERSONNELS: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Début
        <input type="date" style={inputStyle} value={form.Date_debut} onChange={(e) => setForm({ ...form, Date_debut: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Fin
        <input type="date" style={inputStyle} value={form.Date_fin} onChange={(e) => setForm({ ...form, Date_fin: e.target.value })} />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
