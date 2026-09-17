import { useState, type FormEvent } from 'react'
import type { Contact } from './useContacts.js'

// Champs scripturables d'un contact, mêmes clés que le CreateContactDto
// côté backend (backend/src/contact/contact.dto.ts).
export type ContactDto = {
  Civilite: string
  Nom_contact: string
  Prenom_contact: string
  Telephone_portable: string
  Telephone_fixe: string
  E_mail: string
}

type Props = {
  initial: Contact | null
  onSubmit: (dto: ContactDto) => Promise<void>
  onCancel: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
const inputStyle = { padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)' }

// Formulaire de saisie utilisé par la modale de création/modification (voir
// ContactsPage.tsx). `initial` vaut null en création, sinon pré-remplit les
// champs avec la ligne cliquée dans le tableau.
export function ContactForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ContactDto>({
    Civilite: initial?.Civilite ?? '',
    Nom_contact: initial?.Nom_contact ?? '',
    Prenom_contact: initial?.Prenom_contact ?? '',
    Telephone_portable: initial?.Telephone_portable ?? '',
    Telephone_fixe: initial?.Telephone_fixe ?? '',
    E_mail: initial?.E_mail ?? '',
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
        Portable
        <input style={inputStyle} value={form.Telephone_portable} onChange={(e) => setForm({ ...form, Telephone_portable: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Fixe
        <input style={inputStyle} value={form.Telephone_fixe} onChange={(e) => setForm({ ...form, Telephone_fixe: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Email
        <input style={inputStyle} value={form.E_mail} onChange={(e) => setForm({ ...form, E_mail: e.target.value })} />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
