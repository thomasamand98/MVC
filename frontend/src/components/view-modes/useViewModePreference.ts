import { useState } from 'react'
import { TAB_MODE_ID } from './TabMode.js'

const STORAGE_KEY = 'crud-view-mode'
export const DEFAULT_VIEW_MODE = TAB_MODE_ID

// Choix du mode par l'utilisateur désactivé pour l'instant : le sélecteur
// (ViewModeSelector.tsx) n'est plus affiché et toutes les pages utilisent
// DEFAULT_VIEW_MODE. Les autres modes restent dans le code — repasser à
// true pour réafficher le sélecteur et relire le choix enregistré.
export const VIEW_MODE_SELECTION_ENABLED = false

// Le mode choisi est partagé par toutes les pages tableau (une seule
// préférence globale, pas une par page) et persisté en localStorage pour
// survivre à la navigation et au rechargement — voir ViewModeSelector.tsx,
// affiché en haut de chaque page via CrudPage.tsx.
export function useViewModePreference() {
  const [mode, setModeState] = useState<string>(() => {
    // Sélecteur masqué : on ignore un ancien choix enregistré, sinon
    // l'utilisateur resterait bloqué sur un mode qu'il ne peut plus changer.
    if (!VIEW_MODE_SELECTION_ENABLED) return DEFAULT_VIEW_MODE
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
