import { useEffect, useState, type FormEvent } from 'react'
import { useEntite, type EntiteDetail, type EntiteDto } from './useEntite.js'
import { EntiteForm } from './EntiteForm.js'
import '../../components/PageActions.css'

const FORM_ID = 'entite-form'

// Convertit la fiche renvoyée par l'API (champs nullable, adresse imbriquée
// sous `Adresse`) en valeurs de formulaire (tout en string/number, adresse
// aplatie) — voir EntiteDto dans useEntite.ts.
function toDto(detail: EntiteDetail): EntiteDto {
  return {
    Nom_societe: detail.Nom_societe ?? '',
    Nom_court: detail.Nom_court ?? '',
    Num_Telephone: detail.Num_Telephone ?? '',
    Email_contact: detail.Email_contact ?? '',
    Num_TVA: detail.Num_TVA ?? '',
    Nom_Banque: detail.Nom_Banque ?? '',
    Iban: detail.Iban ?? '',
    Bic: detail.Bic ?? '',
    Signataire: detail.Signataire ?? '',
    numero_ucm: detail.numero_ucm ?? '',
    Num_licence: detail.Num_licence ?? '',
    Valeur_facial_cheque_repas: detail.Valeur_facial_cheque_repas ?? 0,
    Seveur_SMTP: detail.Seveur_SMTP ?? '',
    Port_SMTP: detail.Port_SMTP ?? 0,
    Utilisateur_SMTP: detail.Utilisateur_SMTP ?? '',
    MDP_SMTP: detail.MDP_SMTP ?? '',
    TypeConnexion_SMTP: detail.TypeConnexion_SMTP ?? 0,
    Utilisateur_smtp_planning: detail.Utilisateur_smtp_planning ?? '',
    MDP_SMTP_Planning: detail.MDP_SMTP_Planning ?? '',
    Adresse1: detail.Adresse?.Adresse1 ?? '',
    Adresse2: detail.Adresse?.Adresse2 ?? '',
    Adresse3: detail.Adresse?.Adresse3 ?? '',
    CP: detail.Adresse?.CP ?? '',
    Localite: detail.Adresse?.Localite ?? '',
    Pays: detail.Adresse?.Pays ?? '',
    Pays_full_name: detail.Adresse?.Pays_full_name ?? '',
  }
}

// Page "Société" du groupe Configuration : contrairement aux autres
// <Entite>Page.tsx sous src/features/, pas de CrudPage/DataTable/Modal ici
// — une seule fiche existe (voir useEntite.ts), affichée directement comme
// un formulaire de page. Le bouton Enregistrer vit dans l'en-tête (attribut
// `form`, voir FORM_ID) pour rester visible en haut, comme dans la maquette
// fournie par l'utilisateur.
export function EntitePage() {
  const { data, loading, error, update } = useEntite()
  const [form, setForm] = useState<EntiteDto | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (data) setForm(toDto(data))
  }, [data])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setSubmitting(true)
    try {
      await update(form)
    } catch (err) {
      alert(`Échec de l'enregistrement : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p>Chargement des coordonnées de l'entreprise...</p>
  if (error) return <p>Erreur : {error}</p>
  if (!form) return null

  return (
    <div>
      <div className="page-header">
        <h2>Coordonnée entreprise</h2>
        <button type="submit" form={FORM_ID} className="page-actions-button primary" disabled={submitting}>
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
      <EntiteForm formId={FORM_ID} form={form} onChange={setForm} onSubmit={handleSubmit} />
    </div>
  )
}
