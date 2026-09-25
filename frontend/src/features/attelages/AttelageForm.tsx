import { useMemo, useState, type FormEvent } from 'react'
import type { Attelage, AttelageVehicule } from './useAttelages.js'
import type { Chauffeur } from '../chauffeurs/useChauffeurs.js'
import type { Vehicule } from '../vehicules/useVehicules.js'
import type { Societe } from '../societes/useSocietes.js'
import { useUnsavedForm } from '../../components/unsaved-changes/UnsavedChangesContext.js'

// Champs scripturables d'un attelage de référence, mêmes clés que le
// CreateAttelageDto côté backend (backend/src/attelage/attelage.dto.ts) :
// IDs en string (BigInt non sérialisable côté JSON), '' = aucun lien.
export type AttelageDto = {
  IDCHAUFFEUR: string
  IDTRACTEUR: string
  IDREMORQUE: string
  IDSOCIETES: string
}

type Props = {
  initial: Attelage | null
  // Valeurs préremplies en création (projection depuis une seule ligne,
  // voir components/projection/relations.ts) — ignorées en modification.
  defaults?: Partial<AttelageDto>
  // Listes chargées par AttelagesPage et passées en props pour les
  // sélecteurs — évite de les recharger à chaque ouverture de la modale.
  chauffeurs: Chauffeur[]
  vehicules: Vehicule[]
  societes: Societe[]
  onSubmit: (dto: AttelageDto) => Promise<void>
  onCancel: () => void
}

// Codes de l'énumération « type_vehicule » proposés dans chaque sélecteur.
const TYPE_TRACTEUR = 1
const TYPE_REMORQUE = 2

// Un id 0 (défaut WinDev) équivaut à « aucun lien ».
function linkId(value: string | null | undefined): string {
  return value && value !== '0' ? value : ''
}

function vehiculeLabel(v: AttelageVehicule): string {
  return [v.Marque, v.Modele].filter(Boolean).join(' ') + (v.Num_immat ? ` (${v.Num_immat})` : '')
}

function byLabel<T>(label: (item: T) => string) {
  return (a: T, b: T) => label(a).localeCompare(label(b), 'fr')
}

// Formulaire de saisie utilisé par la modale de création/modification (voir
// AttelagesPage.tsx). `initial` vaut null en création, sinon pré-remplit les
// champs avec la ligne cliquée dans le tableau. Tracteur et Remorque ne
// proposent que les véhicules de ce type ; le véhicule déjà lié reste
// affiché même s'il est d'un autre type.
export function AttelageForm({ initial, defaults, chauffeurs, vehicules, societes, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<AttelageDto>({
    IDCHAUFFEUR: linkId(initial?.IDCHAUFFEUR),
    IDTRACTEUR: linkId(initial?.IDTRACTEUR),
    IDREMORQUE: linkId(initial?.IDREMORQUE),
    IDSOCIETES: linkId(initial?.IDSOCIETES),
    ...(initial ? {} : defaults),
  })
  const [submitting, setSubmitting] = useState(false)

  const sortedChauffeurs = useMemo(() => [...chauffeurs].sort(byLabel((c) => c.Nom_chauffeur ?? '')), [chauffeurs])
  const sortedSocietes = useMemo(() => [...societes].sort(byLabel((s) => s.Nom_societe ?? '')), [societes])
  const tracteurs = useMemo(() => vehicules.filter((v) => v.Type === TYPE_TRACTEUR).sort(byLabel(vehiculeLabel)), [vehicules])
  const remorques = useMemo(() => vehicules.filter((v) => v.Type === TYPE_REMORQUE).sort(byLabel(vehiculeLabel)), [vehicules])

  async function save() {
    setSubmitting(true)
    try {
      await onSubmit(form)
    } finally {
      setSubmitting(false)
    }
  }

  // Quitter la fiche modifiée demande « Enregistrer / Annuler les
  // modifications » (voir components/unsaved-changes/).
  const { formRef, confirmLeave } = useUnsavedForm(form, save)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void save()
  }

  const set = (key: keyof AttelageDto, value: string) => setForm({ ...form, [key]: value })

  // Option pour la valeur liée absente de la liste proposée (autre type de
  // véhicule, chauffeur archivé, liste pas encore chargée...).
  function currentOption(value: string, listed: boolean, label: string | null | undefined) {
    return value && !listed ? <option value={value}>{label || value}</option> : null
  }

  function vehiculeSelect(key: 'IDTRACTEUR' | 'IDREMORQUE', options: Vehicule[], linked: AttelageVehicule | null | undefined) {
    const value = form[key]
    const other = vehicules.find((v) => v.IDVEHICULES === value)
    return (
      <select value={value} onChange={(e) => set(key, e.target.value)}>
        <option value="" />
        {currentOption(value, options.some((v) => v.IDVEHICULES === value), other ? vehiculeLabel(other) : linked ? vehiculeLabel(linked) : null)}
        {options.map((v) => (
          <option key={v.IDVEHICULES} value={v.IDVEHICULES}>{vehiculeLabel(v)}</option>
        ))}
      </select>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="form fiche">
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => void confirmLeave(onCancel)}>Annuler</button>
        <button type="submit" className="btn primary" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
      <label className="field">
        <span className="field-label">Chauffeur</span>
        <select value={form.IDCHAUFFEUR} onChange={(e) => set('IDCHAUFFEUR', e.target.value)}>
          <option value="" />
          {currentOption(form.IDCHAUFFEUR, sortedChauffeurs.some((c) => c.IDCHAUFFEURS === form.IDCHAUFFEUR), initial?.Chauffeur?.Nom_chauffeur)}
          {sortedChauffeurs.map((c) => (
            <option key={c.IDCHAUFFEURS} value={c.IDCHAUFFEURS}>{c.Nom_chauffeur}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="field-label">Tracteur</span>
        {vehiculeSelect('IDTRACTEUR', tracteurs, initial?.Tracteur)}
      </label>
      <label className="field">
        <span className="field-label">Remorque</span>
        {vehiculeSelect('IDREMORQUE', remorques, initial?.Remorque)}
      </label>
      <label className="field">
        <span className="field-label">Société</span>
        <select value={form.IDSOCIETES} onChange={(e) => set('IDSOCIETES', e.target.value)}>
          <option value="" />
          {currentOption(form.IDSOCIETES, sortedSocietes.some((s) => s.IDSOCIETES === form.IDSOCIETES), initial?.Societe?.Nom_societe)}
          {sortedSocietes.map((s) => (
            <option key={s.IDSOCIETES} value={s.IDSOCIETES}>{s.Nom_societe}</option>
          ))}
        </select>
      </label>
    </form>
  )
}
