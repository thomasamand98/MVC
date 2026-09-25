import { useState, type FormEvent } from 'react'
import type { CategorieEnumeration, CategorieEnumerationDto } from './useEnumerations.js'
import { useUnsavedForm } from '../../components/unsaved-changes/UnsavedChangesContext.js'

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

  async function save() {
    setSubmitting(true)
    try {
      await onSubmit({ Nom: form.Nom.trim(), Nom_affiche: form.Nom_affiche.trim() })
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
        Libellé affiché
        <input
          value={form.Nom_affiche}
          onChange={(e) => setForm({ ...form, Nom_affiche: e.target.value })}
          maxLength={50}
          required
          autoFocus
        />
      </label>
      <label className="field">
        Nom technique
        <input
          value={form.Nom}
          onChange={(e) => setForm({ ...form, Nom: e.target.value })}
          maxLength={50}
          required
          disabled={isSystem}
          placeholder="ex. type_vehicule"
        />
        {isSystem && <span className="field-hint">Catégorie système : le nom technique ne peut pas être modifié.</span>}
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
