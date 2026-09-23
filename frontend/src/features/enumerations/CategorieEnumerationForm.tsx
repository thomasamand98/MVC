import { useState, type FormEvent } from 'react'
import type { CategorieEnumeration, CategorieEnumerationDto } from './useEnumerations.js'

type Props = {
  initial: CategorieEnumeration | null
  onSubmit: (dto: CategorieEnumerationDto) => Promise<void>
  onCancel: () => void
}

// Formulaire de la modale de création/modification d'une catégorie (voir
// EnumerationsPage.tsx). `initial` vaut null en création. Le nom technique
// (`Nom`) d'une catégorie système est verrouillé : le code applicatif la
// retrouve par ce nom.
export function CategorieEnumerationForm({ initial, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CategorieEnumerationDto>({
    Nom: initial?.Nom ?? '',
    Nom_affiche: initial?.Nom_affiche ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const isSystem = Boolean(initial?.Enum_system)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onSubmit({ Nom: form.Nom.trim(), Nom_affiche: form.Nom_affiche.trim() })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="enum-form">
      <label className="enum-field">
        Libellé affiché
        <input
          value={form.Nom_affiche}
          onChange={(e) => setForm({ ...form, Nom_affiche: e.target.value })}
          maxLength={50}
          required
          autoFocus
        />
      </label>
      <label className="enum-field">
        Nom technique
        <input
          value={form.Nom}
          onChange={(e) => setForm({ ...form, Nom: e.target.value })}
          maxLength={50}
          required
          disabled={isSystem}
          placeholder="ex. type_vehicule"
        />
        {isSystem && <span className="enum-field-hint">Catégorie système : le nom technique ne peut pas être modifié.</span>}
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
