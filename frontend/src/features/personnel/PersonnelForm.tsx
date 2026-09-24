import { useState, type FormEvent } from 'react'
import '../../components/PageActions.css'
import type { PersonnelDetail } from './usePersonnel.js'

// Champs scripturables d'un personnel, mêmes clés que le
// CreatePersonnelDto côté backend (backend/src/personnel/personnel.dto.ts) :
// IDADRESSES en string (BigInt non sérialisable côté JSON), dates en ISO
// string. Routier/Manutention/Atelier sont des codes 0/1 côté vrai modèle
// Prisma (pas des booléens).
export type PersonnelDto = {
  Civilite_Personnel: string
  Nom_Personnel: string
  Prenom_Personnel: string
  Telephone_portable: string
  Telephone_fixe: string
  Telephone_autre: string
  Telephone_professionnel: string
  Description_telephone: string
  E_mail: string
  E_mail_professionnel: string
  Num_service_social: string
  Num_registre_national: string
  Date_naissance: string
  Lieu_naissance: string
  Pays_Naissance: string
  Etat_civil: string
  Nbr_personne_charge: number
  Iban: string
  Bic: string
  Nom_Banque: string
  Qualification: string
  Routier: number
  Manutention: number
  Atelier: number
  Commentaire_Personnel: string
  IDADRESSES: string
  Date_validite_selection_medicale: string
  Date_validite_carte_chauffeur: string
  Date_validite_CAP: string
  Date_validite_carte_identite: string
  Date_validite_A1: string
  Date_validite_SIPSI: string
}

type Props = {
  initial: PersonnelDetail | null
  onSubmit: (dto: PersonnelDto) => Promise<void>
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
// PersonnelPage.tsx). `initial` vaut null en création, sinon la fiche
// complète du personnel (GET /personnel/:id, voir usePersonnel.ts) chargée
// par CrudPage avant l'ouverture de la modale. IDADRESSES n'a pas de
// sélecteur dédié (pas de feature Adresses, et pas de lien Prisma vers
// Adresse sur ce modèle) — saisi comme identifiant brut.
export function PersonnelForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<PersonnelDto>({
    Civilite_Personnel: initial?.Civilite_Personnel ?? '',
    Nom_Personnel: initial?.Nom_Personnel ?? '',
    Prenom_Personnel: initial?.Prenom_Personnel ?? '',
    Telephone_portable: initial?.Telephone_portable ?? '',
    Telephone_fixe: initial?.Telephone_fixe ?? '',
    Telephone_autre: initial?.Telephone_autre ?? '',
    Telephone_professionnel: initial?.Telephone_professionnel ?? '',
    Description_telephone: initial?.Description_telephone ?? '',
    E_mail: initial?.E_mail ?? '',
    E_mail_professionnel: initial?.E_mail_professionnel ?? '',
    Num_service_social: initial?.Num_service_social ?? '',
    Num_registre_national: initial?.Num_registre_national ?? '',
    Date_naissance: toDateInput(initial?.Date_naissance),
    Lieu_naissance: initial?.Lieu_naissance ?? '',
    Pays_Naissance: initial?.Pays_Naissance ?? '',
    Etat_civil: initial?.Etat_civil ?? '',
    Nbr_personne_charge: initial?.Nbr_personne_charge ?? 0,
    Iban: initial?.Iban ?? '',
    Bic: initial?.Bic ?? '',
    Nom_Banque: initial?.Nom_Banque ?? '',
    Qualification: initial?.Qualification ?? '',
    Routier: initial?.Routier ?? 0,
    Manutention: initial?.Manutention ?? 0,
    Atelier: initial?.Atelier ?? 0,
    Commentaire_Personnel: initial?.Commentaire_Personnel ?? '',
    IDADRESSES: initial?.IDADRESSES ?? '',
    Date_validite_selection_medicale: toDateInput(initial?.Date_validite_selection_medicale),
    Date_validite_carte_chauffeur: toDateInput(initial?.Date_validite_carte_chauffeur),
    Date_validite_CAP: toDateInput(initial?.Date_validite_CAP),
    Date_validite_carte_identite: toDateInput(initial?.Date_validite_carte_identite),
    Date_validite_A1: toDateInput(initial?.Date_validite_A1),
    Date_validite_SIPSI: toDateInput(initial?.Date_validite_SIPSI),
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

  function oui_non(value: number, onChange: (v: number) => void) {
    return (
      <select style={inputStyle} value={value} onChange={(e) => onChange(Number(e.target.value))}>
        <option value={0}>Non</option>
        <option value={1}>Oui</option>
      </select>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button type="button" className="page-actions-button secondary" onClick={onCancel}>Annuler</button>
        <button type="submit" className="page-actions-button primary" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
      <label style={fieldStyle}>
        Civilité
        <input style={inputStyle} value={form.Civilite_Personnel} onChange={(e) => setForm({ ...form, Civilite_Personnel: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Prénom
        <input style={inputStyle} value={form.Prenom_Personnel} onChange={(e) => setForm({ ...form, Prenom_Personnel: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Nom
        <input style={inputStyle} value={form.Nom_Personnel} onChange={(e) => setForm({ ...form, Nom_Personnel: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Date de naissance
        <input type="date" style={inputStyle} value={form.Date_naissance} onChange={(e) => setForm({ ...form, Date_naissance: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Lieu de naissance
        <input style={inputStyle} value={form.Lieu_naissance} onChange={(e) => setForm({ ...form, Lieu_naissance: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Pays de naissance
        <input style={inputStyle} value={form.Pays_Naissance} onChange={(e) => setForm({ ...form, Pays_Naissance: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        État civil
        <input style={inputStyle} value={form.Etat_civil} onChange={(e) => setForm({ ...form, Etat_civil: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Personnes à charge
        <input
          type="number"
          style={inputStyle}
          value={form.Nbr_personne_charge}
          onChange={(e) => setForm({ ...form, Nbr_personne_charge: Number(e.target.value) })}
        />
      </label>
      <label style={fieldStyle}>
        Téléphone portable
        <input style={inputStyle} value={form.Telephone_portable} onChange={(e) => setForm({ ...form, Telephone_portable: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Téléphone fixe
        <input style={inputStyle} value={form.Telephone_fixe} onChange={(e) => setForm({ ...form, Telephone_fixe: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Téléphone professionnel
        <input
          style={inputStyle}
          value={form.Telephone_professionnel}
          onChange={(e) => setForm({ ...form, Telephone_professionnel: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Autre téléphone
        <input style={inputStyle} value={form.Telephone_autre} onChange={(e) => setForm({ ...form, Telephone_autre: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Description du téléphone
        <input
          style={inputStyle}
          value={form.Description_telephone}
          onChange={(e) => setForm({ ...form, Description_telephone: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Email
        <input style={inputStyle} value={form.E_mail} onChange={(e) => setForm({ ...form, E_mail: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Email professionnel
        <input
          style={inputStyle}
          value={form.E_mail_professionnel}
          onChange={(e) => setForm({ ...form, E_mail_professionnel: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Code service social
        <input style={inputStyle} value={form.Num_service_social} onChange={(e) => setForm({ ...form, Num_service_social: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        N° registre national
        <input
          style={inputStyle}
          value={form.Num_registre_national}
          onChange={(e) => setForm({ ...form, Num_registre_national: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Qualification
        <input style={inputStyle} value={form.Qualification} onChange={(e) => setForm({ ...form, Qualification: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Routier
        {oui_non(form.Routier, (v) => setForm({ ...form, Routier: v }))}
      </label>
      <label style={fieldStyle}>
        Manutention
        {oui_non(form.Manutention, (v) => setForm({ ...form, Manutention: v }))}
      </label>
      <label style={fieldStyle}>
        Atelier
        {oui_non(form.Atelier, (v) => setForm({ ...form, Atelier: v }))}
      </label>
      <label style={fieldStyle}>
        ID adresse
        <input style={inputStyle} value={form.IDADRESSES} onChange={(e) => setForm({ ...form, IDADRESSES: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        IBAN
        <input style={inputStyle} value={form.Iban} onChange={(e) => setForm({ ...form, Iban: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        BIC
        <input style={inputStyle} value={form.Bic} onChange={(e) => setForm({ ...form, Bic: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Banque
        <input style={inputStyle} value={form.Nom_Banque} onChange={(e) => setForm({ ...form, Nom_Banque: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Validité sélection médicale
        <input
          type="date"
          style={inputStyle}
          value={form.Date_validite_selection_medicale}
          onChange={(e) => setForm({ ...form, Date_validite_selection_medicale: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Validité carte chauffeur
        <input
          type="date"
          style={inputStyle}
          value={form.Date_validite_carte_chauffeur}
          onChange={(e) => setForm({ ...form, Date_validite_carte_chauffeur: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Validité CAP
        <input
          type="date"
          style={inputStyle}
          value={form.Date_validite_CAP}
          onChange={(e) => setForm({ ...form, Date_validite_CAP: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Validité carte d'identité
        <input
          type="date"
          style={inputStyle}
          value={form.Date_validite_carte_identite}
          onChange={(e) => setForm({ ...form, Date_validite_carte_identite: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Validité A1
        <input
          type="date"
          style={inputStyle}
          value={form.Date_validite_A1}
          onChange={(e) => setForm({ ...form, Date_validite_A1: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Validité SIPSI
        <input
          type="date"
          style={inputStyle}
          value={form.Date_validite_SIPSI}
          onChange={(e) => setForm({ ...form, Date_validite_SIPSI: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Commentaire
        <textarea
          style={{ ...inputStyle, resize: 'vertical' as const }}
          rows={3}
          value={form.Commentaire_Personnel}
          onChange={(e) => setForm({ ...form, Commentaire_Personnel: e.target.value })}
        />
      </label>
    </form>
  )
}
