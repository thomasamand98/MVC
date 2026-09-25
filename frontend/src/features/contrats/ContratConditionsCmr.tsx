import { useState } from 'react'
import type { ConditionCmr } from './useContrats.js'
import { useApiMutation } from '../../lib/useApiMutation.js'
import { PlusIcon, TrashIcon } from './icons.js'

// Champs scripturables d'une condition CMR, mêmes clés que
// CreateConditionCmrDto côté backend
// (backend/src/condition-cmr/condition-cmr.dto.ts). Boite_a_cocher est un
// code 0/1 (pas un booléen).
type ConditionCmrDto = {
  IDCONTRATS: string
  Libelle: string
  Boite_a_cocher: number
}

type Props = {
  // null en création : la condition a besoin d'un contrat enregistré pour
  // s'y rattacher, le bloc est alors désactivé.
  contratId: string | null
  conditions: ConditionCmr[]
  onChange: (conditions: ConditionCmr[]) => void
}

// Bloc « Conditions CMR » de la fiche contrat : contrairement au reste du
// formulaire, chaque ajout/coche/suppression est envoyé tout de suite à
// l'API (voir condition-cmr.controller.ts) sans attendre « Enregistrer » —
// ce sont des lignes à part entière, pas des champs du contrat.
export function ContratConditionsCmr({ contratId, conditions, onChange }: Props) {
  const api = useApiMutation<ConditionCmrDto, ConditionCmr>('conditions-cmr')
  const [libelle, setLibelle] = useState('')
  const [boite, setBoite] = useState(false)
  const [busy, setBusy] = useState(false)
  const disabled = contratId === null

  // Enveloppe commune : verrouille les boutons pendant l'appel et affiche
  // l'échec plutôt que de laisser la promesse rejetée non gérée.
  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true)
    try {
      await action()
    } catch (err) {
      alert(`${failure} : ${err instanceof Error ? err.message : 'erreur inconnue'}`)
    } finally {
      setBusy(false)
    }
  }

  async function handleAdd() {
    const label = libelle.trim()
    if (!contratId || !label || busy) return
    await run(async () => {
      const created = await api.create({ IDCONTRATS: contratId, Libelle: label, Boite_a_cocher: boite ? 1 : 0 })
      onChange([...conditions, created])
      // Champ vidé seulement s'il contient encore le texte envoyé — sinon
      // on écraserait ce que l'utilisateur a tapé pendant la requête.
      setLibelle((current) => (current.trim() === label ? '' : current))
      setBoite(false)
    }, "Échec de l'ajout")
  }

  function handleToggle(condition: ConditionCmr) {
    return run(async () => {
      const updated = await api.update(condition.IDCONDITIONS_CMR, { Boite_a_cocher: condition.Boite_a_cocher ? 0 : 1 })
      onChange(conditions.map((c) => (c.IDCONDITIONS_CMR === updated.IDCONDITIONS_CMR ? updated : c)))
    }, 'Échec de la modification')
  }

  async function handleDelete(condition: ConditionCmr) {
    if (!confirm(`Supprimer la condition « ${condition.Libelle} » ?`)) return
    await run(async () => {
      await api.remove(condition.IDCONDITIONS_CMR)
      onChange(conditions.filter((c) => c.IDCONDITIONS_CMR !== condition.IDCONDITIONS_CMR))
    }, 'Échec de la suppression')
  }

  return (
    <div className="contrat-conditions">
      <div className="contrat-conditions-add">
        <label className="field contrat-conditions-libelle">
          Condition
          <input
            value={libelle}
            onChange={(e) => setLibelle(e.target.value)}
            // Entrée ajoute la condition — sans preventDefault elle
            // soumettrait tout le formulaire du contrat.
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleAdd()
              }
            }}
            maxLength={200}
            disabled={disabled}
            placeholder={disabled ? 'Enregistrez d’abord le contrat' : 'Ajouter une condition'}
          />
        </label>
        <label className="checkbox contrat-checkbox contrat-conditions-box">
          <input type="checkbox" checked={boite} onChange={(e) => setBoite(e.target.checked)} disabled={disabled} />
          Case à cocher
        </label>
        <button
          type="button"
          className="icon-btn primary"
          onClick={handleAdd}
          disabled={disabled || busy || libelle.trim() === ''}
          aria-label="Ajouter la condition"
          title="Ajouter la condition"
        >
          <PlusIcon />
        </button>
      </div>

      {conditions.length === 0 ? (
        <p className="muted">Aucune condition CMR.</p>
      ) : (
        <ul className="contrat-conditions-list">
          {conditions.map((c) => (
            <li key={c.IDCONDITIONS_CMR} className="contrat-conditions-item">
              <span className="contrat-conditions-text">{c.Libelle}</span>
              <label className="checkbox contrat-checkbox" title="Case à cocher">
                <input type="checkbox" checked={Boolean(c.Boite_a_cocher)} onChange={() => handleToggle(c)} disabled={busy} />
                <span className="sr-only">Case à cocher</span>
              </label>
              <button
                type="button"
                className="icon-btn danger"
                onClick={() => handleDelete(c)}
                disabled={busy}
                aria-label="Supprimer la condition"
                title="Supprimer"
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
