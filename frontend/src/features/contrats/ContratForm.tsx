import { useState, type FormEvent } from 'react'
import type { ContratDetail } from './useContrats.js'
import type { Societe } from '../societes/useSocietes.js'

// Champs scripturables d'un contrat, mêmes clés que le CreateContratDto
// côté backend (backend/src/contrat/contrat.dto.ts) : dates en ISO string,
// IDSOCIETES/IDMARCHANDISES/IDTYPES_FACTURE en string (BigInt non
// sérialisable côté JSON), Taux_tva en string (Decimal côté vrai modèle
// Prisma). Offre_de_prix/Archive/Qt_client_facturation/Suivant sont des
// codes 0/1 côté vrai modèle Prisma (pas des booléens).
export type ContratDto = {
  Num_contrat: string
  Description_projet: string
  Date_debut: string
  Date_fin: string
  IDSOCIETES: string
  IDTYPES_FACTURE: string
  Annee_archivage: string
  Offre_de_prix: number
  Note_confidentielle: string
  Instruction_CMR: string
  Version_contrat: string
  Archive: number
  Reference_client: string
  Taux_tva: string
  Qt_client_facturation: number
  Suivant: number
  IDMARCHANDISES: string
  Commissionnaire: string
  Type_contrat: string
}

type Props = {
  initial: ContratDetail | null
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
// ContratsPage.tsx). `initial` vaut null en création, sinon la fiche
// complète du contrat (GET /contrats/:id, voir useContrats.ts) chargée par
// CrudPage avant l'ouverture de la modale.
export function ContratForm({ initial, societes, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ContratDto>({
    Num_contrat: initial?.Num_contrat ?? '',
    Description_projet: initial?.Description_projet ?? '',
    Date_debut: toDateInput(initial?.Date_debut),
    Date_fin: toDateInput(initial?.Date_fin),
    IDSOCIETES: initial?.IDSOCIETES ?? '',
    IDTYPES_FACTURE: initial?.IDTYPES_FACTURE ?? '',
    Annee_archivage: initial?.Annee_archivage ?? '',
    Offre_de_prix: initial?.Offre_de_prix ?? 0,
    Note_confidentielle: initial?.Note_confidentielle ?? '',
    Instruction_CMR: initial?.Instruction_CMR ?? '',
    Version_contrat: initial?.Version_contrat ?? '',
    Archive: initial?.Archive ?? 0,
    Reference_client: initial?.Reference_client ?? '',
    Taux_tva: initial?.Taux_tva ?? '',
    Qt_client_facturation: initial?.Qt_client_facturation ?? 0,
    Suivant: initial?.Suivant ?? 0,
    IDMARCHANDISES: initial?.IDMARCHANDISES ?? '',
    Commissionnaire: initial?.Commissionnaire ?? '',
    Type_contrat: initial?.Type_contrat ?? '',
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
      <label style={fieldStyle}>
        Référence client
        <input style={inputStyle} value={form.Reference_client} onChange={(e) => setForm({ ...form, Reference_client: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Type de contrat
        <input style={inputStyle} value={form.Type_contrat} onChange={(e) => setForm({ ...form, Type_contrat: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Version
        <input style={inputStyle} value={form.Version_contrat} onChange={(e) => setForm({ ...form, Version_contrat: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Année d'archivage
        <input style={inputStyle} value={form.Annee_archivage} onChange={(e) => setForm({ ...form, Annee_archivage: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Archivé
        <select style={inputStyle} value={form.Archive} onChange={(e) => setForm({ ...form, Archive: Number(e.target.value) })}>
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
      <label style={fieldStyle}>
        Offre de prix
        <select style={inputStyle} value={form.Offre_de_prix} onChange={(e) => setForm({ ...form, Offre_de_prix: Number(e.target.value) })}>
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
      <label style={fieldStyle}>
        Suivant
        <select style={inputStyle} value={form.Suivant} onChange={(e) => setForm({ ...form, Suivant: Number(e.target.value) })}>
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
      <label style={fieldStyle}>
        Quantité client facturation
        <select
          style={inputStyle}
          value={form.Qt_client_facturation}
          onChange={(e) => setForm({ ...form, Qt_client_facturation: Number(e.target.value) })}
        >
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
      <label style={fieldStyle}>
        Taux TVA
        <input style={inputStyle} value={form.Taux_tva} onChange={(e) => setForm({ ...form, Taux_tva: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Commissionnaire
        <input style={inputStyle} value={form.Commissionnaire} onChange={(e) => setForm({ ...form, Commissionnaire: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        ID marchandise
        <input style={inputStyle} value={form.IDMARCHANDISES} onChange={(e) => setForm({ ...form, IDMARCHANDISES: e.target.value })} />
      </label>
      {initial?.Marchandise && (
        <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted, gray)' }}>
          Marchandise actuelle : {initial.Marchandise.Nom_marchandise ?? '—'}
        </p>
      )}
      <label style={fieldStyle}>
        ID type de facture
        <input style={inputStyle} value={form.IDTYPES_FACTURE} onChange={(e) => setForm({ ...form, IDTYPES_FACTURE: e.target.value })} />
      </label>
      {initial?.TypeFacture && (
        <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-muted, gray)' }}>
          Type de facture actuel : {initial.TypeFacture.Nom ?? '—'}
        </p>
      )}
      <label style={fieldStyle}>
        Instruction CMR
        <textarea
          style={{ ...inputStyle, resize: 'vertical' as const }}
          rows={2}
          value={form.Instruction_CMR}
          onChange={(e) => setForm({ ...form, Instruction_CMR: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Note confidentielle
        <textarea
          style={{ ...inputStyle, resize: 'vertical' as const }}
          rows={3}
          value={form.Note_confidentielle}
          onChange={(e) => setForm({ ...form, Note_confidentielle: e.target.value })}
        />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
