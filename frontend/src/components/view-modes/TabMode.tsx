import type { ViewModeContainerProps } from './types.js'

export const TAB_MODE_ID = 'tab'

// Mode 8 — Onglet : contrairement aux 7 autres modes, la fiche ne s'affiche
// jamais par-dessus ou à côté du tableau — CrudPage.tsx ouvre directement un
// onglet dédié dans la barre globale de l'application (voir TabsContext.tsx
// et AppLayout.tsx) dès qu'une ligne est double-cliquée ou qu'on clique sur
// « Nouveau ». Ce composant ne sert donc qu'à afficher le tableau seul :
// `open` reste toujours à false pour ce mode (CrudPage ne déclenche jamais
// modalMode dans ce cas), `form` n'est jamais utilisé.
export function TabMode({ table }: ViewModeContainerProps) {
  return <>{table}</>
}
