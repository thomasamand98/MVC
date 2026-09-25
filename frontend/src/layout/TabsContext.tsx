import { createContext, useContext, type ReactNode } from 'react'

export type OpenTabRequest = { id: string; label: string; content: ReactNode }

export type TabsContextValue = {
  // Ouvre un nouvel onglet dans la barre globale (voir TabBar.tsx), ou
  // réactive celui d'id `id` s'il est déjà ouvert (jamais de doublon) —
  // utilisé par le mode "Onglet" de CrudPage.tsx (voir view-modes/TabMode.tsx)
  // pour ouvrir la fiche d'une ligne dans son propre onglet.
  openOrActivateTab: (tab: OpenTabRequest) => void
  // Ferme un onglet (dynamique ou de menu) — bascule sur son voisin s'il
  // était actif, même logique que la croix de TabBar.tsx. Si l'onglet
  // contient une saisie modifiée, demande d'abord « Enregistrer / Annuler
  // les modifications » ; `force` ferme sans demander (ex. juste après un
  // enregistrement réussi).
  closeTab: (id: string, options?: { force?: boolean }) => void
}

export const TabsContext = createContext<TabsContextValue | null>(null)

// Fourni par AppLayout.tsx, qui englobe toutes les pages — toujours
// disponible pour les composants sous src/features/ et src/components/.
export function useTabsContext(): TabsContextValue {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('useTabsContext doit être utilisé sous AppLayout')
  return ctx
}
