import { useState, type FormEvent } from 'react'
import type { Enumeration, EnumerationDto } from './useEnumerations.js'

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
    <form onSubmit={handleSubmit} className="enum-form">
      <label className="enum-field">
        Valeur affichée
        <input
          value={form.Valeur_affiche}
          onChange={(e) => setForm({ ...form, Valeur_affiche: e.target.value })}
          maxLength={150}
          required
          autoFocus
        />
      </label>
      <label className="enum-field">
        Valeur
        <input
          value={form.Valeur}
          onChange={(e) => setForm({ ...form, Valeur: e.target.value })}
          maxLength={150}
          disabled={isSystem}
        />
        {isSystem && <span className="enum-field-hint">Valeur système : la valeur ne peut pas être modifiée.</span>}
      </label>
      <label className="enum-field">
        Valeur associée
        <input
          value={form.Valeur_associee}
          onChange={(e) => setForm({ ...form, Valeur_associee: e.target.value })}
          maxLength={150}
        />
      </label>
      <label className="enum-field enum-field-narrow">
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
        <span className="enum-field-hint">Utilisée par l'application : elle ne peut pas être supprimée.</span>
      </label>
      <div className="enum-form-actions">
        <button type="button" className="enum-button" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="enum-button primary" disabled={submitting}>
          {submitting ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
