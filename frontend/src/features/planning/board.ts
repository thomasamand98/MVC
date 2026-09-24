import { useEffect, useState, type DragEvent } from 'react'
import type { DragItem, DropPreview, GroupBy, PlanningExecution, PlanningResource, StatutExecution } from './types.js'

export const STATUT_LABELS: Record<StatutExecution, string> = {
  planifie: 'Planifiée',
  en_cours: 'En cours',
  termine: 'Terminée',
}

// Ligne/colonne regroupant les exécutions sans chauffeur (ou sans remorque
// en mode « Remorque ») — affichée seulement s'il y en a.
export const UNASSIGNED_ID = '__non_affecte__'

export function resourceIdOf(execution: PlanningExecution, groupBy: GroupBy): string {
  const id = groupBy === 'executant' ? execution.chauffeurId : execution.remorqueId
  return id ?? UNASSIGNED_ID
}

// Props communes aux deux vues (ColumnView / RowView). L'état vit dans
// PlanningPage ; les vues ne font que convertir positions ↔ horaires.
export type BoardProps = {
  days: Date[]
  resources: PlanningResource[]
  executions: PlanningExecution[]
  groupBy: GroupBy
  caByResource: Map<string, number>
  countByResource: Map<string, number>
  selectedId: string | null
  dragItem: DragItem | null
  preview: DropPreview | null
  onSelect: (id: string | null) => void
  onDragStartItem: (item: DragItem, event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
  onPreview: (preview: DropPreview | null) => void
  onDrop: (resourceId: string, start: number) => void
  onResizeEnd: (execution: PlanningExecution, end: number) => void
}

// Heure courante, rafraîchie chaque minute, pour le trait « maintenant ».
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

// Portion d'une exécution visible dans un intervalle (une journée en mode
// colonne, la période en mode ligne).
export type Segment = {
  id: string
  execution: PlanningExecution
  start: number
  end: number
  continuesBefore: boolean
  continuesAfter: boolean
}

export function clipToRange(executions: PlanningExecution[], from: number, to: number): Segment[] {
  return executions
    .filter((e) => e.end > from && e.start < to)
    .map((e) => ({
      id: e.id,
      execution: e,
      start: Math.max(e.start, from),
      end: Math.min(e.end, to),
      continuesBefore: e.start < from,
      continuesAfter: e.end > to,
    }))
}
