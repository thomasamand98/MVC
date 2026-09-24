import { createContext, useContext } from 'react'
import type { EntityKey } from './relations.js'

export type ProjectionRequest = {
  source: EntityKey
  target: EntityKey
  // Ids des lignes sélectionnées dans la table source.
  ids: string[]
  // Libellé de la ligne quand une seule est sélectionnée (« Contrats de
  // ARDENNE CONTAINER » plutôt que « Contrats de 1 société »).
  singleLabel?: string
}

export type ProjectionContextValue = {
  openProjection: (request: ProjectionRequest) => void
}

export const ProjectionContext = createContext<ProjectionContextValue | null>(null)

// Fourni par ProjectionProvider.tsx (monté dans AppLayout.tsx). Séparé du
// provider pour que CrudPage puisse l'utiliser sans importer les pages.
export function useProjection(): ProjectionContextValue | null {
  return useContext(ProjectionContext)
}
