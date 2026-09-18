import { useEffect, useState, type FormEvent } from 'react'
import type { EntiteDto } from './useEntite.js'
import './EntiteForm.css'

type VilleOption = { IDVILLES: string; Nom_ville: string | null }
type PaysOption = { IDPAYS: string; ISO: string | null; Nom: string | null }

// Options de sécurisation de la connexion SMTP — non documentées côté DB
// (pas de table d'énumération pour ce champ, juste un Int côté Entite),
// déduites de la seule donnée existante (TypeConnexion_SMTP=2 ↔ "Option
// Sécurisé TLS" dans la maquette fournie).
const CONNEXION_SMTP_OPTIONS = [
  { value: 0, label: 'Aucune' },
  { value: 1, label: 'SSL' },
  { value: 2, label: 'Option Sécurisé TLS' },
]

type Props = {
  formId: string
  form: EntiteDto
  onChange: (form: EntiteDto) => void
  onSubmit: (e: FormEvent) => void
}

const apiUrl = (path: string) => `http://${window.location.hostname}:3000/${path}`

// Formulaire "Coordonnée entreprise" — pas de bouton de soumission ici, il
// vit dans l'en-tête de EntitePage.tsx (attribut `form`, voir formId) pour
// rester visible en haut de page comme dans la maquette fournie par
// l'utilisateur.
export function EntiteForm({ formId, form, onChange, onSubmit }: Props) {
  const [villeOptions, setVilleOptions] = useState<VilleOption[]>([])
  const [paysOptions, setPaysOptions] = useState<PaysOption[]>([])

  // Liste des pays : ~240 lignes, chargée une seule fois (voir
  // backend/src/pays/pays.service.ts).
  useEffect(() => {
    fetch(apiUrl('pays'))
      .then((res) => res.json() as Promise<{ pays: PaysOption[] }>)
      .then((json) => setPaysOptions(json.pays))
      .catch(() => {})
  }, [])

  // Recherche des villes par code postal, avec un léger anti-rebond — la
  // table en compte ~39 000, impossible à charger en une fois (voir
  // backend/src/ville/ville.service.ts).
  useEffect(() => {
    if (!form.CP) {
      setVilleOptions([])
      return
    }
    const timeout = setTimeout(() => {
      fetch(apiUrl(`villes?cp=${encodeURIComponent(form.CP)}`))
        .then((res) => res.json() as Promise<{ villes: VilleOption[] }>)
        .then((json) => setVilleOptions(json.villes))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(timeout)
  }, [form.CP])

  function handlePaysChange(nom: string) {
    const match = paysOptions.find((p) => p.Nom === nom)
    onChange({ ...form, Pays_full_name: nom, Pays: match?.ISO ?? '' })
  }

  // La ville actuellement enregistrée peut ne pas (ou plus) figurer dans
  // les résultats de recherche (CP pas encore recherché, ville renommée...)
  // — ajoutée à la liste pour ne pas perdre la valeur affichée.
  const villeChoices =
    form.Localite && !villeOptions.some((v) => v.Nom_ville === form.Localite)
      ? [{ IDVILLES: 'current', Nom_ville: form.Localite }, ...villeOptions]
      : villeOptions

  return (
    <form id={formId} className="entite-form" onSubmit={onSubmit}>
      <div className="entite-form-grid">
        <label className="entite-field">
          Nom
          <input value={form.Nom_societe} onChange={(e) => onChange({ ...form, Nom_societe: e.target.value })} />
        </label>
        <label className="entite-field">
          Téléphone
          <input value={form.Num_Telephone} onChange={(e) => onChange({ ...form, Num_Telephone: e.target.value })} />
        </label>
        <label className="entite-field">
          Nom de la Banque
          <input value={form.Nom_Banque} onChange={(e) => onChange({ ...form, Nom_Banque: e.target.value })} />
        </label>

        <label className="entite-field">
          Nom court
          <input value={form.Nom_court} onChange={(e) => onChange({ ...form, Nom_court: e.target.value })} />
        </label>
        <label className="entite-field">
          Email
          <input type="email" value={form.Email_contact} onChange={(e) => onChange({ ...form, Email_contact: e.target.value })} />
        </label>
        <label className="entite-field">
          IBAN
          <input value={form.Iban} onChange={(e) => onChange({ ...form, Iban: e.target.value })} />
        </label>

        <label className="entite-field">
          Adresse 1
          <input value={form.Adresse1} onChange={(e) => onChange({ ...form, Adresse1: e.target.value })} />
        </label>
        <label className="entite-field">
          N° TVA
          <input value={form.Num_TVA} onChange={(e) => onChange({ ...form, Num_TVA: e.target.value })} />
        </label>
        <label className="entite-field">
          BIC
          <input value={form.Bic} onChange={(e) => onChange({ ...form, Bic: e.target.value })} />
        </label>

        <label className="entite-field">
          Adresse 2
          <input value={form.Adresse2} onChange={(e) => onChange({ ...form, Adresse2: e.target.value })} />
        </label>
        <label className="entite-field">
          Nom du signataire
          <input value={form.Signataire} onChange={(e) => onChange({ ...form, Signataire: e.target.value })} />
        </label>
        <label className="entite-field">
          Numéro UCM
          <input value={form.numero_ucm} onChange={(e) => onChange({ ...form, numero_ucm: e.target.value })} />
        </label>

        <label className="entite-field">
          Adresse 3
          <input value={form.Adresse3} onChange={(e) => onChange({ ...form, Adresse3: e.target.value })} />
        </label>
        <label className="entite-field">
          Numéro de licence
          <input value={form.Num_licence} onChange={(e) => onChange({ ...form, Num_licence: e.target.value })} />
        </label>
        <label className="entite-field">
          Valeur faciale chèque repas
          <input
            type="number"
            step="0.01"
            value={form.Valeur_facial_cheque_repas}
            onChange={(e) => onChange({ ...form, Valeur_facial_cheque_repas: Number(e.target.value) })}
          />
        </label>

        <div className="entite-field-group">
          <label className="entite-field">
            Code postal
            <input value={form.CP} onChange={(e) => onChange({ ...form, CP: e.target.value })} />
          </label>
          <label className="entite-field">
            Villes
            <select value={form.Localite} onChange={(e) => onChange({ ...form, Localite: e.target.value })}>
              <option value="">—</option>
              {villeChoices.map((v) => (
                <option key={v.IDVILLES} value={v.Nom_ville ?? ''}>
                  {v.Nom_ville}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="entite-field">
          Pays
          <select value={form.Pays_full_name} onChange={(e) => handlePaysChange(e.target.value)}>
            <option value="">—</option>
            {paysOptions.map((p) => (
              <option key={p.IDPAYS} value={p.Nom ?? ''}>
                {p.Nom}
              </option>
            ))}
          </select>
        </label>
      </div>

      <h3 className="entite-section-title">Configuration des paramètres e-mail</h3>

      <div className="entite-form-grid entite-form-grid-email">
        <span />
        <span className="entite-column-title">E-mail compta</span>
        <span className="entite-column-title">E-mail planning</span>

        <div className="entite-field-group">
          <label className="entite-field">
            Serveur :
            <input value={form.Seveur_SMTP} onChange={(e) => onChange({ ...form, Seveur_SMTP: e.target.value })} />
          </label>
        </div>
        <label className="entite-field">
          Utilisateur :
          <input value={form.Utilisateur_SMTP} onChange={(e) => onChange({ ...form, Utilisateur_SMTP: e.target.value })} />
        </label>
        <label className="entite-field">
          Utilisateur :
          <input value={form.Utilisateur_smtp_planning} onChange={(e) => onChange({ ...form, Utilisateur_smtp_planning: e.target.value })} />
        </label>

        <div className="entite-field-group">
          <label className="entite-field">
            Connexion SMTP :
            <select
              value={form.TypeConnexion_SMTP}
              onChange={(e) => onChange({ ...form, TypeConnexion_SMTP: Number(e.target.value) })}
            >
              {CONNEXION_SMTP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="entite-field entite-field-narrow">
            Port SMTP :
            <input type="number" value={form.Port_SMTP} onChange={(e) => onChange({ ...form, Port_SMTP: Number(e.target.value) })} />
          </label>
        </div>
        <label className="entite-field">
          Mot de passe :
          <input type="password" value={form.MDP_SMTP} onChange={(e) => onChange({ ...form, MDP_SMTP: e.target.value })} />
        </label>
        <label className="entite-field">
          Mot de passe :
          <input type="password" value={form.MDP_SMTP_Planning} onChange={(e) => onChange({ ...form, MDP_SMTP_Planning: e.target.value })} />
        </label>
      </div>
    </form>
  )
}
