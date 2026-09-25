import { useState, type FormEvent } from 'react'
import type { Condition } from './useConditions.js'
import { useUnsavedForm } from '../../components/unsaved-changes/UnsavedChangesContext.js'
import { FicheField, FicheSection } from '../../components/FicheLayout.js'
import { useEnumerationLabels } from '../../lib/useEnumerationLabels.js'
import './ConditionForm.css'

// Champs scripturables d'une condition d'exécution, mêmes clés que le
// CreateConditionDto côté backend (backend/src/condition/condition.dto.ts).
// Type_Prestation est un code de la catégorie d'énumération « type_prestation »
// (1 Routier, 2 Manutention, 3 Valorisation) ; CMR_or_FDR un code 0/1.
export type ConditionDto = {
  Type_Prestation: number
  CMR_or_FDR: number
  Libelle: string
}

type Props = {
  initial: Condition | null
  onSubmit: (dto: ConditionDto) => Promise<void>
  onCancel: () => void
}

// Type proposé à la création : Routier.
const DEFAULT_TYPE_PRESTATION = 1

// Formulaire de saisie utilisé par la modale de création/modification (voir
// ConditionsPage.tsx). `initial` vaut null en création, sinon pré-remplit
// les champs avec la ligne cliquée dans le tableau.
export function ConditionForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<ConditionDto>({
    Type_Prestation: initial ? (initial.Type_Prestation ?? 0) : DEFAULT_TYPE_PRESTATION,
    CMR_or_FDR: initial?.CMR_or_FDR ?? 0,
    Libelle: initial?.Libelle ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const typesPrestation = useEnumerationLabels('type_prestation')

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

  // Le code courant reste sélectionnable même s'il n'est pas (encore) dans
  // l'énumération — chargement en cours, ou 0 hérité de la base.
  const typeKnown = String(form.Type_Prestation) in typesPrestation

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="form fiche">
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => void confirmLeave(onCancel)}>Annuler</button>
        <button type="submit" className="btn primary" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
      <FicheSection title="Condition d'exécution" className="fiche-section--center">
        <div className="cond-grid">
          <label className="fiche-check">
            <span className="field-label">CMR / Feuille de route</span>
            <input
              type="checkbox"
              checked={form.CMR_or_FDR === 1}
              onChange={(e) => setForm({ ...form, CMR_or_FDR: e.target.checked ? 1 : 0 })}
            />
          </label>
          <FicheField label="Type de prestation">
            <select
              value={form.Type_Prestation}
              onChange={(e) => setForm({ ...form, Type_Prestation: Number(e.target.value) })}
            >
              {!typeKnown && <option value={form.Type_Prestation}>{form.Type_Prestation || ''}</option>}
              {Object.entries(typesPrestation).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>{libelle}</option>
              ))}
            </select>
          </FicheField>
          <FicheField label="Libellé" wide>
            <input
              value={form.Libelle}
              maxLength={200}
              onChange={(e) => setForm({ ...form, Libelle: e.target.value })}
            />
          </FicheField>
        </div>
      </FicheSection>
    </form>
  )
}
