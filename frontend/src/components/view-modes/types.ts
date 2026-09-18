import type { ComponentType, ReactNode } from 'react'

export type ViewModeState = 'create' | 'edit' | null

// Contrat commun à tous les modes de saisie/affichage : chacun reçoit le
// tableau déjà construit (`table`) et le formulaire déjà rendu (`form`), et
// décide seul comment les agencer (superposition, panneau latéral, colonne
// fixe...). Voir README.md de ce dossier pour la liste des modes et comment
// n'en garder qu'un seul.
export type ViewModeContainerProps = {
  // true dès qu'un formulaire doit être visible (création ou édition).
  open: boolean
  mode: ViewModeState
  title: string
  onClose: () => void
  // Résultat de `renderForm(...)` — null quand rien n'est ouvert.
  form: ReactNode
  // Le DataTable (+ barre de pagination éventuelle) à afficher.
  table: ReactNode
}

export type ViewModeDefinition = {
  id: string
  label: string
  description: string
  icon: ComponentType
  Component: ComponentType<ViewModeContainerProps>
}
