import { useState, type FormEvent } from 'react'
import type { SocieteDetail } from './useSocietes.js'
import type { Contact } from '../contacts/useContacts.js'
import { Dev } from '../enDeveloppement/Dev.js'
import { SocieteContratsTab } from './SocieteContratsTab.js'
import { SocieteMessagesTab } from './SocieteMessagesTab.js'
import './SocieteForm.css'

// Champs scripturables d'une société, mêmes clés que le CreateSocieteDto
// côté backend (backend/src/societe/societe.dto.ts). Prospect/Archive/
// Client_Facture_mail/Client_Adresse_facturation_societe/Fournisseur_* (les
// mêmes) sont des codes 0/1 côté vrai modèle Prisma (pas des booléens).
export type SocieteDto = {
  Nom_societe: string
  Denomination: string
  TVA: string
  Activite: string
  Site_web: string
  Note: string
  IDADRESSES: string
  Prospect: number
  Archive: number

  Client_Numero_client: string
  Client_Delai_paiement: string
  Client_Taux_tva: string
  Client_E_mail_comptabilite: string
  Client_Facture_mail: number
  Client_Adresse_facturation_societe: number
  Client_IDADRESSES_facturation: string
  Client_IDCONTACTS_Comptabilite: string

  Fournisseur_Numero_fournisseur: string
  Fournisseur_Delai_paiement: string
  Fournisseur_Taux_tva: string
  Fournisseur_E_mail_comptabilite: string
  Fournisseur_Facture_mail: number
  Fournisseur_Adresse_facturation_societe: number
  Fournisseur_IDADRESSES_facturation: string
  Fournisseur_IDCONTACTS_Comptabilite: string
  Fournisseur_Iban: string
  Fournisseur_Bic: string
}

type Props = {
  initial: SocieteDetail | null
  // Liste des contacts pour les sélecteurs « Contact comptabilité »/
  // « Contact planning » — chargée par SocietesPage et passée en prop,
  // même logique que `societes` dans ContratForm.tsx.
  contacts: Contact[]
  onSubmit: (dto: SocieteDto) => Promise<void>
  onCancel: () => void
}

const TOP_TABS = [
  { id: 'principale', label: 'Principale' },
  { id: 'contacts', label: 'Contacts' },
  { id: 'contrats', label: 'Contrats / Offres' },
  { id: 'documents', label: 'Documents' },
  { id: 'messages', label: 'Msg envoyés' },
] as const

type TopTabId = (typeof TOP_TABS)[number]['id']

function contactLabel(c: { Civilite?: string | null; Nom_contact: string | null; Prenom_contact: string | null }): string {
  return [c.Nom_contact, c.Prenom_contact].filter(Boolean).join(' ') || '—'
}

// Formulaire de saisie utilisé par la modale de création/modification (voir
// SocietesPage.tsx). `initial` vaut null en création, sinon la fiche
// complète de la société (GET /societes/:id, voir useSocietes.ts) chargée
// par CrudPage avant l'ouverture de la modale. Les onglets Contacts/
// Contrats/Documents/Messages ne portent que de la consultation liée à un
// enregistrement existant — désactivés tant que la société n'est pas créée.
export function SocieteForm({ initial, contacts, onSubmit, onCancel }: Props) {
  const [topTab, setTopTab] = useState<TopTabId>('principale')
  const [billingTab, setBillingTab] = useState<'client' | 'fournisseur'>('client')
  const [form, setForm] = useState<SocieteDto>({
    Nom_societe: initial?.Nom_societe ?? '',
    Denomination: initial?.Denomination ?? '',
    TVA: initial?.TVA ?? '',
    Activite: initial?.Activite ?? '',
    Site_web: initial?.Site_web ?? '',
    Note: initial?.Note ?? '',
    IDADRESSES: initial?.IDADRESSES ?? '',
    Prospect: initial?.Prospect ?? 0,
    Archive: initial?.Archive ?? 0,

    Client_Numero_client: initial?.Client?.Numero_client ?? '',
    Client_Delai_paiement: initial?.Client?.Delai_paiement ?? '',
    Client_Taux_tva: initial?.Client?.Taux_tva ?? '',
    Client_E_mail_comptabilite: initial?.Client?.E_mail_comptabilite ?? '',
    Client_Facture_mail: initial?.Client?.Facture_mail ?? 0,
    Client_Adresse_facturation_societe: initial?.Client?.Adresse_facturation_societe ?? 1,
    Client_IDADRESSES_facturation: initial?.Client?.IDADRESSES_facturation ?? '',
    Client_IDCONTACTS_Comptabilite: initial?.Client?.IDCONTACTS_Comptabilite ?? '',

    Fournisseur_Numero_fournisseur: initial?.Fournisseur?.Numero_fournisseur ?? '',
    Fournisseur_Delai_paiement: initial?.Fournisseur?.Delai_paiement ?? '',
    Fournisseur_Taux_tva: initial?.Fournisseur?.Taux_tva ?? '',
    Fournisseur_E_mail_comptabilite: initial?.Fournisseur?.E_mail_comptabilite ?? '',
    Fournisseur_Facture_mail: initial?.Fournisseur?.Facture_mail ?? 0,
    Fournisseur_Adresse_facturation_societe: initial?.Fournisseur?.Adresse_facturation_societe ?? 1,
    Fournisseur_IDADRESSES_facturation: initial?.Fournisseur?.IDADRESSES_facturation ?? '',
    Fournisseur_IDCONTACTS_Comptabilite: initial?.Fournisseur?.IDCONTACTS_Comptabilite ?? '',
    Fournisseur_Iban: initial?.Fournisseur?.Iban ?? '',
    Fournisseur_Bic: initial?.Fournisseur?.Bic ?? '',
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
    <div className="societe-form">
      <div className="societe-form-toptabs" role="tablist">
        {TOP_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={topTab === tab.id}
            className={`societe-form-toptab${topTab === tab.id ? ' active' : ''}`}
            disabled={tab.id !== 'principale' && !initial}
            title={tab.id !== 'principale' && !initial ? 'Enregistrez d’abord la société pour accéder à cet onglet' : undefined}
            onClick={() => setTopTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {topTab === 'principale' && (
        <form onSubmit={handleSubmit} className="societe-form-principale">
          <div className="societe-form-columns">
            <section className="societe-form-section">
              <h4 className="societe-form-section-title">Coordonnées</h4>
              <label className="societe-field">
                Nom
                <input value={form.Nom_societe} onChange={(e) => setForm({ ...form, Nom_societe: e.target.value })} />
              </label>
              <label className="societe-field">
                Dénomination
                <input value={form.Denomination} onChange={(e) => setForm({ ...form, Denomination: e.target.value })} />
              </label>
              <label className="societe-field">
                N° TVA
                <input value={form.TVA} onChange={(e) => setForm({ ...form, TVA: e.target.value })} />
              </label>
              <label className="societe-field">
                Activité
                <input value={form.Activite} onChange={(e) => setForm({ ...form, Activite: e.target.value })} />
              </label>
              <label className="societe-field">
                Site web
                <input value={form.Site_web} onChange={(e) => setForm({ ...form, Site_web: e.target.value })} />
              </label>
              <div className="societe-field-row">
                <label className="societe-field">
                  Prospect
                  <select value={form.Prospect} onChange={(e) => setForm({ ...form, Prospect: Number(e.target.value) })}>
                    <option value={0}>Non</option>
                    <option value={1}>Oui</option>
                  </select>
                </label>
                <label className="societe-field">
                  Archivée
                  <select value={form.Archive} onChange={(e) => setForm({ ...form, Archive: Number(e.target.value) })}>
                    <option value={0}>Non</option>
                    <option value={1}>Oui</option>
                  </select>
                </label>
              </div>
              <label className="societe-field">
                ID adresse
                <input value={form.IDADRESSES} onChange={(e) => setForm({ ...form, IDADRESSES: e.target.value })} />
              </label>
              {initial?.Adresse && (
                <p className="societe-form-hint">
                  Adresse actuelle : {[initial.Adresse.Adresse1, initial.Adresse.CP, initial.Adresse.Localite].filter(Boolean).join(', ') || '—'}
                </p>
              )}
              <label className="societe-field">
                Note
                <textarea rows={4} value={form.Note} onChange={(e) => setForm({ ...form, Note: e.target.value })} />
              </label>
            </section>

            <section className="societe-form-section societe-form-billing">
              <div className="societe-billing-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={billingTab === 'client'}
                  className={`societe-billing-tab${billingTab === 'client' ? ' active' : ''}`}
                  onClick={() => setBillingTab('client')}
                >
                  Client
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={billingTab === 'fournisseur'}
                  className={`societe-billing-tab${billingTab === 'fournisseur' ? ' active' : ''}`}
                  onClick={() => setBillingTab('fournisseur')}
                >
                  Fournisseur
                </button>
              </div>

              {billingTab === 'client' ? (
                <div className="societe-billing-panel">
                  <h4 className="societe-form-section-title">Données pour la facturation client</h4>
                  <div className="societe-field-row">
                    <label className="societe-field">
                      Numéro client
                      <input value={form.Client_Numero_client} onChange={(e) => setForm({ ...form, Client_Numero_client: e.target.value })} />
                    </label>
                    <label className="societe-field">
                      Délai de paiement
                      <input value={form.Client_Delai_paiement} onChange={(e) => setForm({ ...form, Client_Delai_paiement: e.target.value })} />
                    </label>
                  </div>
                  <div className="societe-field-row">
                    <label className="societe-field">
                      Taux de TVA (%)
                      <input value={form.Client_Taux_tva} onChange={(e) => setForm({ ...form, Client_Taux_tva: e.target.value })} />
                    </label>
                    <label className="societe-field">
                      E-mail comptabilité
                      <input type="email" value={form.Client_E_mail_comptabilite} onChange={(e) => setForm({ ...form, Client_E_mail_comptabilite: e.target.value })} />
                    </label>
                  </div>
                  <label className="societe-field">
                    Contact pour la comptabilité
                    <select
                      value={form.Client_IDCONTACTS_Comptabilite}
                      onChange={(e) => setForm({ ...form, Client_IDCONTACTS_Comptabilite: e.target.value })}
                    >
                      <option value="">—</option>
                      {contacts.map((c) => (
                        <option key={c.IDCONTACTS} value={c.IDCONTACTS}>{contactLabel(c)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="societe-checkbox">
                    <input
                      type="checkbox"
                      checked={form.Client_Facture_mail === 1}
                      onChange={(e) => setForm({ ...form, Client_Facture_mail: e.target.checked ? 1 : 0 })}
                    />
                    Facture e-mail
                  </label>
                  <label className="societe-checkbox">
                    <input
                      type="checkbox"
                      checked={form.Client_Adresse_facturation_societe === 1}
                      onChange={(e) => setForm({ ...form, Client_Adresse_facturation_societe: e.target.checked ? 1 : 0 })}
                    />
                    Adresse de facturation = adresse de la société
                  </label>
                  {form.Client_Adresse_facturation_societe !== 1 && (
                    <label className="societe-field">
                      ID adresse de facturation
                      <input
                        value={form.Client_IDADRESSES_facturation}
                        onChange={(e) => setForm({ ...form, Client_IDADRESSES_facturation: e.target.value })}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <div className="societe-billing-panel">
                  <h4 className="societe-form-section-title">Données pour la facturation fournisseur</h4>
                  <div className="societe-field-row">
                    <label className="societe-field">
                      Numéro fournisseur
                      <input
                        value={form.Fournisseur_Numero_fournisseur}
                        onChange={(e) => setForm({ ...form, Fournisseur_Numero_fournisseur: e.target.value })}
                      />
                    </label>
                    <label className="societe-field">
                      Délai de paiement
                      <input
                        value={form.Fournisseur_Delai_paiement}
                        onChange={(e) => setForm({ ...form, Fournisseur_Delai_paiement: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="societe-field-row">
                    <label className="societe-field">
                      Taux de TVA (%)
                      <input value={form.Fournisseur_Taux_tva} onChange={(e) => setForm({ ...form, Fournisseur_Taux_tva: e.target.value })} />
                    </label>
                    <label className="societe-field">
                      E-mail comptabilité
                      <input
                        type="email"
                        value={form.Fournisseur_E_mail_comptabilite}
                        onChange={(e) => setForm({ ...form, Fournisseur_E_mail_comptabilite: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="societe-field-row">
                    <label className="societe-field">
                      IBAN
                      <input value={form.Fournisseur_Iban} onChange={(e) => setForm({ ...form, Fournisseur_Iban: e.target.value })} />
                    </label>
                    <label className="societe-field">
                      BIC
                      <input value={form.Fournisseur_Bic} onChange={(e) => setForm({ ...form, Fournisseur_Bic: e.target.value })} />
                    </label>
                  </div>
                  <label className="societe-field">
                    Contact pour la comptabilité
                    <select
                      value={form.Fournisseur_IDCONTACTS_Comptabilite}
                      onChange={(e) => setForm({ ...form, Fournisseur_IDCONTACTS_Comptabilite: e.target.value })}
                    >
                      <option value="">—</option>
                      {contacts.map((c) => (
                        <option key={c.IDCONTACTS} value={c.IDCONTACTS}>{contactLabel(c)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="societe-checkbox">
                    <input
                      type="checkbox"
                      checked={form.Fournisseur_Facture_mail === 1}
                      onChange={(e) => setForm({ ...form, Fournisseur_Facture_mail: e.target.checked ? 1 : 0 })}
                    />
                    Facture e-mail
                  </label>
                  <label className="societe-checkbox">
                    <input
                      type="checkbox"
                      checked={form.Fournisseur_Adresse_facturation_societe === 1}
                      onChange={(e) => setForm({ ...form, Fournisseur_Adresse_facturation_societe: e.target.checked ? 1 : 0 })}
                    />
                    Adresse de facturation = adresse de la société
                  </label>
                  {form.Fournisseur_Adresse_facturation_societe !== 1 && (
                    <label className="societe-field">
                      ID adresse de facturation
                      <input
                        value={form.Fournisseur_IDADRESSES_facturation}
                        onChange={(e) => setForm({ ...form, Fournisseur_IDADRESSES_facturation: e.target.value })}
                      />
                    </label>
                  )}
                </div>
              )}
            </section>
          </div>

          <div className="societe-form-actions">
            <button type="button" onClick={onCancel}>Annuler</button>
            <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </form>
      )}

      {topTab === 'contacts' && (
        initial && initial.SocieteContacts.length > 0 ? (
          <table className="societe-tab-table">
            <thead>
              <tr>
                <th>Contact</th>
                <th>Fonction</th>
                <th>Service / Bureau</th>
              </tr>
            </thead>
            <tbody>
              {initial.SocieteContacts.map((sc, i) => (
                <tr key={i}>
                  <td>{[sc.Contact?.Nom_contact, sc.Contact?.Prenom_contact].filter(Boolean).join(' ') || '—'}</td>
                  <td>{sc.Fonction_contact || '—'}</td>
                  <td>{sc.Service_bureau || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="societe-tab-empty">Aucun contact lié à cette société.</p>
        )
      )}

      {topTab === 'contrats' && initial && <SocieteContratsTab societeId={initial.IDSOCIETES} />}
      {topTab === 'documents' && <Dev />}
      {topTab === 'messages' && initial && <SocieteMessagesTab societeId={initial.IDSOCIETES} />}
    </div>
  )
}
