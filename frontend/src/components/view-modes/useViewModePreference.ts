import { useState } from 'react'

const STORAGE_KEY = 'crud-view-mode'
export const DEFAULT_VIEW_MODE = 'modal'

// Le mode choisi est partagé par toutes les pages tableau (une seule
// préférence globale, pas une par page) et persisté en localStorage pour
// survivre à la navigation et au rechargement — voir ViewModeSelector.tsx,
// affiché en haut de chaque page via CrudPage.tsx.
export function useViewModePreference() {
  const [mode, setModeState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_VIEW_MODE
    } catch {
      return DEFAULT_VIEW_MODE
    }
  })

  function setMode(id: string) {
    setModeState(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Stockage indisponible (navigation privée...) : le choix reste actif
      // pour la session en cours via le state React ci-dessus.
    }
  }

  return [mode, setMode] as const
}
