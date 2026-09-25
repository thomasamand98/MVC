import { useState, type FormEvent } from 'react'
import type { Enumeration, EnumerationDto } from './useEnumerations.js'
import { useUnsavedForm } from '../../components/unsaved-changes/UnsavedChangesContext.js'

type Props = {
  categorieId: string
  // Ordre proposé à la création (dernier ordre de la catégorie + 1).
  defaultOrdre: number
  initial: Enumeration | null
  onSubmit: (dto: EnumerationDto) => Promise<void>
  onCancel: () => void
}

// Formulaire de la modale de création/modification d'une valeur (voir
// EnumerationsPage.tsx). `initial` vaut null en création. La `Valeur` d'une
// valeur système est verrouillée : le code applicatif la compare telle
// quelle.
export function EnumerationForm({ categorieId, defaultOrdre, initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<EnumerationDto>({
    IDCATEGORIES_ENUMERATION: categorieId,
    Valeur_affiche: initial?.Valeur_affiche ?? '',
    Valeur: initial?.Valeur ?? '',
    Ordre: initial?.Ordre ?? defaultOrdre,
    Valeur_associee: initial?.Valeur_associee ?? '',
    Valeur_system: initial?.Valeur_system ?? 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const isSystem = Boolean(initial?.Valeur_system)

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

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="enum-form">
      <label className="field">
        Valeur affichée
        <input
          value={form.Valeur_affiche}
          onChange={(e) => setForm({ ...form, Valeur_affiche: e.target.value })}
          maxLength={150}
          required
          autoFocus
        />
      </label>
      <label className="field">
        Valeur
        <input
          value={form.Valeur}
          onChange={(e) => setForm({ ...form, Valeur: e.target.value })}
          maxLength={150}
          disabled={isSystem}
        />
        {isSystem && <span className="field-hint">Valeur système : la valeur ne peut pas être modifiée.</span>}
      </label>
      <label className="field">
        Valeur associée
        <input
          value={form.Valeur_associee}
          onChange={(e) => setForm({ ...form, Valeur_associee: e.target.value })}
          maxLength={150}
        />
      </label>
      <label className="field enum-field-narrow">
        Ordre
        <input
          type="number"
          value={form.Ordre}
          onChange={(e) => setForm({ ...form, Ordre: Number(e.target.value) })}
        />
      </label>
      <label className="enum-checkbox">
        <input
          type="checkbox"
          checked={form.Valeur_system === 1}
          onChange={(e) => setForm({ ...form, Valeur_system: e.target.checked ? 1 : 0 })}
        />
        Valeur système
        <span className="field-hint">Utilisée par l'application : elle ne peut pas être supprimée.</span>
      </label>
      <div className="form-actions">
        <button type="button" className="btn" onClick={() => void confirmLeave(onCancel)}>
          Annuler
        </button>
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
