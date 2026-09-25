import { useEffect, type CSSProperties } from 'react'
import { formatDayLong, formatMoney, formatTime } from './dateUtils.js'
import { STATUT_LABELS } from './board.js'
import { CloseIcon } from './icons.js'
import type { PlanningExecution } from './types.js'

type Props = {
  execution: PlanningExecution
  chauffeurNom: string | null
  onClose: () => void
}

// Fiche de l'exécution sélectionnée, affichée par-dessus le planning : les
// cartes de la grille sont souvent trop petites pour tout montrer.
export function ExecutionDetails({ execution: e, chauffeurNom, onClose }: Props) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <section className="pl-details" aria-label="Détail de l'exécution" style={{ '--m': e.marchandise.couleur } as CSSProperties}>
      <header className="pl-details-head">
        <div>
          <div className="pl-details-kicker">
            <span className="pl-swatch" /> {e.marchandise.nom}
            {e.nature === 'chargement' && <span className="pl-badge pl-badge--warn">Déchargement différé</span>}
            {e.nature === 'dechargement' && <span className="pl-badge">Déchargement</span>}
          </div>
          <h3>{e.client}</h3>
        </div>
        <button type="button" className="icon-btn outlined" onClick={onClose} aria-label="Fermer"><CloseIcon /></button>
      </header>

      <dl className="pl-details-grid">
        <dt>Statut</dt>
        <dd className="pl-details-status"><span className={`pl-status-dot pl-status-dot--${e.statut}`} /> {STATUT_LABELS[e.statut]}</dd>
        <dt>Horaire</dt>
        <dd>{formatDayLong(e.start)}, {formatTime(e.start)} – {formatTime(e.end)}</dd>
        <dt>Trajet</dt>
        <dd>{e.depart} → {e.arrivee}</dd>
        <dt>Référence</dt>
        <dd>{e.reference ?? '—'}</dd>
        <dt>Chauffeur</dt>
        <dd>{chauffeurNom ?? 'Non affecté'}</dd>
        <dt>Attelage</dt>
        <dd>
          {e.tracteur ? <span className="pl-plate">{e.tracteur}</span> : '—'}{' '}
          {e.remorqueImmat && <span className="pl-plate">{e.remorqueImmat}</span>}
        </dd>
        <dt>Montant</dt>
        <dd><strong>{formatMoney(e.montant)}</strong></dd>
        {e.refPlanning && (
          <>
            <dt>Réf. planning</dt>
            <dd className="pl-mono">{e.refPlanning}</dd>
          </>
        )}
        {e.instruction && (
          <>
            <dt>Instruction</dt>
            <dd>{e.instruction}</dd>
          </>
        )}
      </dl>
    </section>
  )
}
