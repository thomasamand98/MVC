import { useState, type FormEvent } from 'react'
import '../../components/PageActions.css'
import type { ContactDetail } from './useContacts.js'
import type { Societe } from '../societes/useSocietes.js'

// Champs scripturables d'un contact, mêmes clés que le CreateContactDto
// côté backend (backend/src/contact/contact.dto.ts). Personne_physique/
// Adresse_entreprise sont des codes 0/1 côté vrai modèle Prisma (pas des
// booléens) — voir les selects Oui/Non ci-dessous.
export type ContactDto = {
  Civilite: string
  Nom_contact: string
  Prenom_contact: string
  Telephone_portable: string
  Telephone_fixe: string
  Telephone_autre: string
  E_mail: string
  Remarque: string
  Personne_physique: number
  Adresse_entreprise: number
  description_telephone: string
  IDADRESSES: string
  // Société principale (liste « Société ») et fonction/service dans cette
  // société — lien SocieteContacts géré par le backend (createContact/
  // updateContact). Vide : aucune société principale.
  IDSOCIETES: string
  Fonction_contact: string
  Service_bureau: string
}

type Props = {
  initial: ContactDetail | null
  // Sociétés pour la liste « Société » — chargées par la page et passées en
  // prop (même principe que ContratForm).
  societes: Societe[]
  // Société présélectionnée en création (onglet Contacts de la fiche
  // Société, voir SocieteContactsTab.tsx) — ignorée en modification.
  defaultSocieteId?: string
  onSubmit: (dto: ContactDto) => Promise<void>
  onCancel: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
const inputStyle = { padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)' }

// Formulaire de saisie utilisé par la modale de création/modification (voir
// ContactsPage.tsx). `initial` vaut null en création, sinon la fiche
// complète du contact (GET /contacts/:id, voir useContacts.ts) chargée par
// CrudPage avant l'ouverture de la modale.
export function ContactForm({ initial, societes, defaultSocieteId, onSubmit, onCancel }: Props) {
  const [principal, ...autresSocietes] = initial?.SocieteContacts ?? []
  const [form, setForm] = useState<ContactDto>({
    Civilite: initial?.Civilite ?? '',
    Nom_contact: initial?.Nom_contact ?? '',
    Prenom_contact: initial?.Prenom_contact ?? '',
    Telephone_portable: initial?.Telephone_portable ?? '',
    Telephone_fixe: initial?.Telephone_fixe ?? '',
    Telephone_autre: initial?.Telephone_autre ?? '',
    E_mail: initial?.E_mail ?? '',
    Remarque: initial?.Remarque ?? '',
    Personne_physique: initial?.Personne_physique ?? 0,
    Adresse_entreprise: initial?.Adresse_entreprise ?? 0,
    description_telephone: initial?.description_telephone ?? '',
    IDADRESSES: initial?.IDADRESSES ?? '',
    IDSOCIETES: initial ? (principal?.IDSOCIETES ?? '') : (defaultSocieteId ?? ''),
    Fonction_contact: principal?.Fonction_contact ?? '',
    Service_bureau: principal?.Service_bureau ?? '',
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
        Société
        <select style={inputStyle} value={form.IDSOCIETES} onChange={(e) => setForm({ ...form, IDSOCIETES: e.target.value })}>
          <option value="">—</option>
          {societes.map((s) => (
            <option key={s.IDSOCIETES} value={s.IDSOCIETES}>{s.Nom_societe}</option>
          ))}
        </select>
      </label>
      {form.IDSOCIETES && (
        <>
          <label style={fieldStyle}>
            Fonction
            <input style={inputStyle} value={form.Fonction_contact} onChange={(e) => setForm({ ...form, Fonction_contact: e.target.value })} />
          </label>
          <label style={fieldStyle}>
            Service / Bureau
            <input style={inputStyle} value={form.Service_bureau} onChange={(e) => setForm({ ...form, Service_bureau: e.target.value })} />
          </label>
        </>
      )}
      <label style={fieldStyle}>
        Civilité
        <input style={inputStyle} value={form.Civilite} onChange={(e) => setForm({ ...form, Civilite: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Nom
        <input style={inputStyle} value={form.Nom_contact} onChange={(e) => setForm({ ...form, Nom_contact: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Prénom
        <input style={inputStyle} value={form.Prenom_contact} onChange={(e) => setForm({ ...form, Prenom_contact: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Personne physique
        <select
          style={inputStyle}
          value={form.Personne_physique}
          onChange={(e) => setForm({ ...form, Personne_physique: Number(e.target.value) })}
        >
          <option value={0}>Non</option>
          <option value={1}>Oui</option>
        </select>
      </label>
      <label style={fieldStyle}>
        Portable
        <input style={inputStyle} value={form.Telephone_portable} onChange={(e) => setForm({ ...form, Telephone_portable: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Fixe
        <input style={inputStyle} value={form.Telephone_fixe} onChange={(e) => setForm({ ...form, Telephone_fixe: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Autre téléphone
        <input style={inputStyle} value={form.Telephone_autre} onChange={(e) => setForm({ ...form, Telephone_autre: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Description du téléphone
        <input
          style={inputStyle}
          value={form.description_telephone}
          onChange={(e) => setForm({ ...form, description_telephone: e.target.value })}
        />
      </label>
      <label style={fieldStyle}>
        Email
        <input style={inputStyle} value={form.E_mail} onChange={(e) => setForm({ ...form, E_mail: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Adresse entreprise
        <select
          style={inputStyle}
          value={form.Adresse_entreprise}
          onChange={(e) => setForm({ ...form, Adresse_entreprise: Number(e.target.value) })}
        >
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
        Remarque
        <textarea
          style={{ ...inputStyle, resize: 'vertical' as const }}
          rows={3}
          value={form.Remarque}
          onChange={(e) => setForm({ ...form, Remarque: e.target.value })}
        />
      </label>
      {autresSocietes.length > 0 && (
        <div style={fieldStyle}>
          <span>Autres sociétés liées</span>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {autresSocietes.map((sc, i) => (
              <li key={i}>
                {sc.Societe?.Nom_societe ?? '—'}
                {sc.Fonction_contact ? ` (${sc.Fonction_contact})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      {initial && initial.PointContacts.length > 0 && (
        <div style={fieldStyle}>
          <span>Points liés</span>
          <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
            {initial.PointContacts.map((pc, i) => (
              <li key={i}>
                {pc.Point?.Libelle ?? '—'}
                {pc.Lien ? ` (${pc.Lien})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
