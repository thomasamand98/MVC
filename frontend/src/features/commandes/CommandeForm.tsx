import { useState, type FormEvent } from 'react'
import type { Commande } from './useCommandes.js'
import type { Contrat } from '../contrats/useContrats.js'

// Champs scripturables d'une commande, mêmes clés que le CreateCommandeDto
// côté backend (backend/src/commande/commande.dto.ts) : IDCONTRATS/
// IDPRESTATIONS en string (BigInt non sérialisable côté JSON), Date_commande
// en ISO string.
export type CommandeDto = {
  Date_commande: string
  IDCONTRATS: string
  IDPRESTATIONS: string
  QT: number
  QT_planifie: number
  Statut: string
  NumRef: string
  Instruction: string
}

type Props = {
  initial: Commande | null
  // Liste des contrats pour le sélecteur — chargée par CommandesPage et
  // passée en prop plutôt que rechargée ici, pour ne pas refaire un GET
  // /contrats à chaque ouverture de la modale.
  contrats: Contrat[]
  onSubmit: (dto: CommandeDto) => Promise<void>
  onCancel: () => void
}

const fieldStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.25rem' }
const inputStyle = { padding: '0.4rem 0.5rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--bg)', color: 'var(--text)' }

// Convertit une date ISO (renvoyée par l'API) en "AAAA-MM-JJ", format attendu
// par <input type="date">.
function toDateInput(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}

// Formulaire de saisie utilisé par la modale de création/modification (voir
// CommandesPage.tsx). `initial` vaut null en création, sinon pré-remplit les
// champs avec la ligne cliquée dans le tableau. IDPRESTATIONS n'a pas de
// sélecteur dédié (pas de feature Prestations) — saisi comme identifiant
// brut.
export function CommandeForm({ initial, contrats, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CommandeDto>({
    Date_commande: toDateInput(initial?.Date_commande),
    IDCONTRATS: initial?.IDCONTRATS ?? '',
    IDPRESTATIONS: initial?.IDPRESTATIONS ?? '',
    QT: initial?.QT ?? 0,
    QT_planifie: initial?.QT_planifie ?? 0,
    Statut: initial?.Statut ?? '',
    NumRef: initial?.NumRef ?? '',
    Instruction: initial?.Instruction ?? '',
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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <label style={fieldStyle}>
        Date
        <input type="date" style={inputStyle} value={form.Date_commande} onChange={(e) => setForm({ ...form, Date_commande: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Contrat
        <select style={inputStyle} value={form.IDCONTRATS} onChange={(e) => setForm({ ...form, IDCONTRATS: e.target.value })}>
          <option value="">—</option>
          {contrats.map((c) => (
            <option key={c.IDCONTRATS} value={c.IDCONTRATS}>{c.Num_contrat} — {c.Societe?.Nom_societe}</option>
          ))}
        </select>
      </label>
      <label style={fieldStyle}>
        ID prestation
        <input style={inputStyle} value={form.IDPRESTATIONS} onChange={(e) => setForm({ ...form, IDPRESTATIONS: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Quantité
        <input type="number" style={inputStyle} value={form.QT} onChange={(e) => setForm({ ...form, QT: Number(e.target.value) })} />
      </label>
      <label style={fieldStyle}>
        Quantité planifiée
        <input
          type="number"
          style={inputStyle}
          value={form.QT_planifie}
          onChange={(e) => setForm({ ...form, QT_planifie: Number(e.target.value) })}
        />
      </label>
      <label style={fieldStyle}>
        Statut
        <input style={inputStyle} value={form.Statut} onChange={(e) => setForm({ ...form, Statut: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Référence
        <input style={inputStyle} value={form.NumRef} onChange={(e) => setForm({ ...form, NumRef: e.target.value })} />
      </label>
      <label style={fieldStyle}>
        Instruction
        <textarea
          style={{ ...inputStyle, resize: 'vertical' as const }}
          rows={3}
          value={form.Instruction}
          onChange={(e) => setForm({ ...form, Instruction: e.target.value })}
        />
      </label>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button type="button" onClick={onCancel}>Annuler</button>
        <button type="submit" disabled={submitting}>{submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
      </div>
    </form>
  )
}
