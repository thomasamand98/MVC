import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { apiFetch, apiJson } from '../../lib/api'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { useContacts, type Contact, type ContactDetail } from '../contacts/useContacts.js'
import { ContactForm, type ContactDto } from '../contacts/ContactForm.js'
import { useSocietes } from '../societes/useSocietes.js'
import { Modal } from '../../components/Modal.js'
import { PlusIcon } from '../../components/FicheLayout.js'

// Au-delà, la fiche point n'affiche que les premiers contacts (MAX_PAGE_SIZE
// côté backend).
const MAX_CONTACTS = 500

type Props = {
  pointId: string
}

// Fiche complète ouverte depuis une carte : un contact existant, ou un
// nouveau contact (créé lié au point).
type Opened = { mode: 'edit'; contact: Contact } | { mode: 'create' }

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'erreur inconnue'
}

// Onglet « Contacts » de la fiche Point (PointForm.tsx) : une carte
// simplifiée par contact lié au point (fonction, téléphones, email,
// « Recevoir le planning »), comme dans WinDev. L'œil ouvre la fiche contact
// complète (ContactForm) dans une modale ; « − » retire le contact du point
// sans le supprimer. « Recevoir le planning » est enregistré immédiatement
// (lien point_contacts, hors du formulaire du point).
export function PointContactsTab({ pointId }: Props) {
  const { contacts, setContacts, loading, error, refetch } = useContacts({ page: 1, pageSize: MAX_CONTACTS, filters: { pointId } })
  const { create, update } = useApiMutation<ContactDto, Contact, ContactDetail>('contacts')
  // Pour la liste « Société » de la fiche complète (voir ContactForm.tsx).
  const { societes } = useSocietes()
  const [opened, setOpened] = useState<Opened | null>(null)

  async function togglePlanning(contact: Contact, on: boolean) {
    const value = on ? 1 : 0
    const patchRow = (v: number) =>
      setContacts((prev) =>
        prev.map((c) => (c.IDCONTACTS === contact.IDCONTACTS ? { ...c, PointContacts: [{ Lien: c.PointContacts?.[0]?.Lien ?? null, Recevoir_Mail_Planning: v }] } : c)),
      )
    patchRow(value)
    try {
      await apiFetch(`points/${pointId}/contacts/${contact.IDCONTACTS}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Recevoir_Mail_Planning: value }),
      })
    } catch (err) {
      patchRow(1 - value)
      alert(`Échec de l'enregistrement : ${errorMessage(err)}`)
    }
  }

  async function unlink(contact: Contact) {
    if (!confirm(`Retirer ${contactName(contact)} de ce point ?\nLe contact n’est pas supprimé.`)) return
    try {
      await apiFetch(`points/${pointId}/contacts/${contact.IDCONTACTS}`, { method: 'DELETE' })
      await refetch()
    } catch (err) {
      alert(`Échec du retrait : ${errorMessage(err)}`)
    }
  }

  // Enregistrement de la fiche complète : la modale se ferme sur un succès,
  // reste ouverte (avec la saisie) sur un échec.
  async function handleSubmit(dto: ContactDto) {
    if (!opened) return
    try {
      if (opened.mode === 'edit') await update(opened.contact.IDCONTACTS, dto)
      else await create({ ...dto, IDPOINTS: pointId })
      await refetch()
      setOpened(null)
    } catch (err) {
      alert(`Échec de l'enregistrement : ${errorMessage(err)}`)
    }
  }

  if (loading && contacts.length === 0) return <p className="fiche-empty">Chargement des contacts...</p>
  if (error) return <p className="crud-page-error">Erreur : {error}</p>

  return (
    <div className="pt-contacts">
      <div className="pt-contacts-head">
        <span className="pt-contacts-count">
          {contacts.length === 0 ? 'Aucun contact lié à ce point' : `${contacts.length} contact${contacts.length > 1 ? 's' : ''} lié${contacts.length > 1 ? 's' : ''}`}
        </span>
        <button type="button" className="btn sm" onClick={() => setOpened({ mode: 'create' })}>
          <PlusIcon /> Nouveau contact
        </button>
      </div>

      {contacts.length > 0 && (
        <ul className="pt-contact-cards">
          {contacts.map((c) => (
            <ContactCard
              key={c.IDCONTACTS}
              contact={c}
              onView={() => setOpened({ mode: 'edit', contact: c })}
              onUnlink={() => void unlink(c)}
              onTogglePlanning={(on) => void togglePlanning(c, on)}
            />
          ))}
        </ul>
      )}

      {/* Portail : la fiche point peut s'afficher dans un tiroir ou un
          panneau transformé (voir components/view-modes/), qui enfermerait
          une modale imbriquée. */}
      {opened &&
        createPortal(
          <Modal title={opened.mode === 'edit' ? contactName(opened.contact) : 'Nouveau contact'} onClose={() => setOpened(null)}>
            {opened.mode === 'edit' ? (
              <ContactFiche contactId={opened.contact.IDCONTACTS}>
                {(detail) => <ContactForm initial={detail} societes={societes} onSubmit={handleSubmit} onCancel={() => setOpened(null)} />}
              </ContactFiche>
            ) : (
              <ContactForm initial={null} societes={societes} onSubmit={handleSubmit} onCancel={() => setOpened(null)} />
            )}
          </Modal>,
          document.body,
        )}
    </div>
  )
}

function contactName(c: Contact): string {
  return [c.Civilite, c.Prenom_contact, c.Nom_contact?.toUpperCase()].filter(Boolean).join(' ') || 'Sans nom'
}

type CardProps = {
  contact: Contact
  onView: () => void
  onUnlink: () => void
  onTogglePlanning: (on: boolean) => void
}

// Carte simplifiée, en lecture seule sauf « Recevoir le planning ».
function ContactCard({ contact, onView, onUnlink, onTogglePlanning }: CardProps) {
  const name = contactName(contact)
  const lien = contact.PointContacts?.[0]
  return (
    <li className="pt-contact-card">
      <div className="pt-contact-card-head">
        <strong title={name}>{name}</strong>
        <button type="button" className="pt-icon-btn pt-icon-btn--view" onClick={onView} title="Voir la fiche complète" aria-label={`Voir la fiche de ${name}`}>
          <EyeIcon />
        </button>
        <button type="button" className="pt-icon-btn pt-icon-btn--remove" onClick={onUnlink} title="Retirer du point" aria-label={`Retirer ${name} de ce point`}>
          <MinusIcon />
        </button>
      </div>
      {lien?.Lien && <span className="pt-contact-card-lien">{lien.Lien}</span>}
      <dl className="pt-contact-card-fields">
        <CardField label="Fonction" value={contact.SocieteContacts[0]?.Fonction_contact} wide />
        <CardField label="Téléphone fixe" value={contact.Telephone_fixe} href={contact.Telephone_fixe ? `tel:${contact.Telephone_fixe.replace(/[^\d+]/g, '')}` : undefined} />
        <CardField label="Téléphone portable" value={contact.Telephone_portable} href={contact.Telephone_portable ? `tel:${contact.Telephone_portable.replace(/[^\d+]/g, '')}` : undefined} />
        <CardField label="Email" value={contact.E_mail} href={contact.E_mail ? `mailto:${contact.E_mail}` : undefined} wide />
      </dl>
      <label className="pt-contact-card-planning">
        <span>Recevoir le planning</span>
        <input type="checkbox" checked={lien?.Recevoir_Mail_Planning === 1} onChange={(e) => onTogglePlanning(e.target.checked)} />
      </label>
    </li>
  )
}

function CardField({ label, value, href, wide }: { label: string; value: string | null | undefined; href?: string; wide?: boolean }) {
  return (
    <div className={`pt-contact-card-field${wide ? ' is-wide' : ''}`}>
      <dt>{label}</dt>
      <dd>{value ? (href ? <a href={href}>{value}</a> : value) : <span className="pt-contact-card-empty">—</span>}</dd>
    </div>
  )
}

// Charge la fiche complète (GET /contacts/:id) avant d'afficher le
// formulaire.
function ContactFiche({ contactId, children }: { contactId: string; children: (detail: ContactDetail) => ReactNode }) {
  const [detail, setDetail] = useState<ContactDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    apiJson<ContactDetail>(`contacts/${contactId}`)
      .then((json) => { if (!cancelled) setDetail(json) })
      .catch((err: unknown) => { if (!cancelled) setLoadError(errorMessage(err)) })
    return () => { cancelled = true }
  }, [contactId])

  if (loadError) return <p className="crud-page-error">Erreur : {loadError}</p>
  if (!detail) return <p className="fiche-empty">Chargement de la fiche...</p>
  return <>{children(detail)}</>
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  )
}
