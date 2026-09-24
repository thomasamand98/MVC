import { useRef, useState, type CSSProperties, type DragEvent, type PointerEvent } from 'react'
import { formatTime, MINUTE_MS, SNAP_MINUTES, snapMinutes } from './dateUtils.js'
import { STATUT_LABELS } from './board.js'
import type { PlanningExecution } from './types.js'

// Redimensionnement par la poignée de fin de carte : bord bas en mode
// colonne (axe y), bord droit en mode ligne (axe x).
export type ResizeConfig = {
  axis: 'x' | 'y'
  pxPerMinute: number
  onResizeEnd: (execution: PlanningExecution, end: number) => void
}

type Props = {
  execution: PlanningExecution
  style: CSSProperties
  selected: boolean
  // La carte est coupée par le bord de la journée (mode colonne) ou de la
  // période (mode ligne) : on l'indique pour ne pas laisser croire qu'elle
  // s'arrête là.
  continuesBefore?: boolean
  continuesAfter?: boolean
  // Absent quand la fin de l'exécution n'est pas visible sur ce segment.
  resize?: ResizeConfig
  onSelect: (id: string) => void
  onDragStart: (execution: PlanningExecution, event: DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
}

// Carte d'une exécution sur la grille. Sa couleur est celle de la
// marchandise (Marchandise.CouleurPlanning) ; le contenu se réduit selon la
// place disponible (voir les @container de Planning.css).
export function ExecutionCard({ execution: e, style, selected, continuesBefore, continuesAfter, resize, onSelect, onDragStart, onDragEnd }: Props) {
  // Écart de durée (minutes) pendant un redimensionnement en cours.
  const [deltaMinutes, setDeltaMinutes] = useState(0)
  const resizeOrigin = useRef<number | null>(null)
  const end = e.end + deltaMinutes * MINUTE_MS
  const route = `${e.depart} → ${e.arrivee}`

  const sizedStyle = { ...style, '--m': e.marchandise.couleur } as CSSProperties
  if (resize && deltaMinutes !== 0) {
    const extra = deltaMinutes * resize.pxPerMinute
    if (resize.axis === 'y') sizedStyle.height = Number(style.height) + extra
    else sizedStyle.width = Number(style.width) + extra
  }

  function position(event: PointerEvent<HTMLElement>) {
    return resize?.axis === 'y' ? event.clientY : event.clientX
  }

  function handleResizeStart(event: PointerEvent<HTMLSpanElement>) {
    event.stopPropagation()
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeOrigin.current = position(event)
  }

  function handleResizeMove(event: PointerEvent<HTMLSpanElement>) {
    if (resizeOrigin.current === null || !resize) return
    const minutes = snapMinutes((position(event) - resizeOrigin.current) / resize.pxPerMinute)
    // Durée minimale : un pas de la grille.
    const minDelta = SNAP_MINUTES - (e.end - e.start) / MINUTE_MS
    setDeltaMinutes(Math.max(minutes, minDelta))
  }

  function handleResizeEnd() {
    if (resizeOrigin.current === null) return
    resizeOrigin.current = null
    const delta = deltaMinutes
    setDeltaMinutes(0)
    if (delta !== 0 && resize) resize.onResizeEnd(e, e.end + delta * MINUTE_MS)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      className={`pl-card pl-card--${e.statut}${selected ? ' is-selected' : ''}${continuesBefore ? ' continues-before' : ''}${continuesAfter ? ' continues-after' : ''}${deltaMinutes !== 0 ? ' is-resizing' : ''}`}
      style={sizedStyle}
      title={`${e.client} — ${e.marchandise.nom}\n${route}\n${formatTime(e.start)} – ${formatTime(end)} · ${STATUT_LABELS[e.statut]}`}
      aria-pressed={selected}
      onClick={(event) => { event.stopPropagation(); onSelect(e.id) }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(e.id)
        }
      }}
      onDragStart={(event) => {
        // Un appui sur la poignée peut quand même déclencher le glisser natif
        // de la carte : on l'annule pendant un redimensionnement.
        if (resizeOrigin.current !== null) {
          event.preventDefault()
          return
        }
        onDragStart(e, event)
      }}
      onDragEnd={onDragEnd}
    >
      <div className="pl-card-inner">
        <div className="pl-card-top">
          <span className="pl-card-time">{formatTime(e.start)} – {formatTime(end)}</span>
          <span className={`pl-status-dot pl-status-dot--${e.statut}`} aria-label={STATUT_LABELS[e.statut]} />
        </div>
        <div className="pl-card-client">{e.client}</div>
        <div className="pl-card-line pl-card-goods">
          {e.marchandise.nom}
          {e.reference && <span className="pl-card-ref"> · {e.reference}</span>}
        </div>
        <div className="pl-card-line pl-card-route">{route}</div>
        {(e.tracteur || e.remorqueImmat || e.nature !== 'complete') && (
          <div className="pl-card-tags">
            {e.tracteur && <span className="pl-plate">{e.tracteur}</span>}
            {e.remorqueImmat && <span className="pl-plate">{e.remorqueImmat}</span>}
            {e.nature === 'chargement' && <span className="pl-badge pl-badge--warn">Déch. différé</span>}
            {e.nature === 'dechargement' && <span className="pl-badge">Déchargement</span>}
          </div>
        )}
      </div>
      {resize && (
        <span
          className={`pl-card-resize pl-card-resize--${resize.axis}`}
          aria-hidden="true"
          title="Glisser pour changer la fin"
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={() => { resizeOrigin.current = null; setDeltaMinutes(0) }}
          onClick={(event) => event.stopPropagation()}
        />
      )}
    </div>
  )
}
