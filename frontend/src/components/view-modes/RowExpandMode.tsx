import type { ReactNode } from 'react'
import type { ViewModeContainerProps } from './types.js'
import './RowExpandMode.css'

export const ROW_EXPAND_MODE_ID = 'row-expand'

// Mode 7 — Ligne + bloc : la création reprend le bloc rétractable en haut de
// page (voir InlinePanelMode), mais la modification déplie directement la
// ligne concernée dans le tableau, via `renderExpandedRow` sur DataTable
// (câblage spécifique fait dans CrudPage.tsx, ce mode ayant besoin d'agir
// sur le tableau lui-même et pas seulement sur ce qui l'entoure — voir
// RowFicheContent ci-dessous, qui habille la ligne dépliée).
export function RowExpandMode({ open, mode, title, onClose, form, table }: ViewModeContainerProps) {
  const showTopPanel = open && mode === 'create'
  return (
    <div className="vm-rowexpand">
      <div className={`vm-rowexpand-panel${showTopPanel ? ' open' : ''}`}>
        {mode === 'create' && (
          <div className="vm-rowexpand-panel-inner">
            <div className="vm-rowexpand-header">
              <h3 className="vm-rowexpand-title">{title}</h3>
              <button type="button" className="vm-rowexpand-close" onClick={onClose} aria-label="Fermer">
                ×
              </button>
            </div>
            <div className="vm-rowexpand-body">{form}</div>
          </div>
        )}
      </div>
      {table}
    </div>
  )
}

type RowFicheContentProps = {
  title: string
  onClose: () => void
  children: ReactNode
}

// Habillage (titre + bouton fermer) de la fiche affichée directement dans
// la ligne dépliée du tableau — voir CrudPage.tsx, qui le passe à
// `DataTable.renderExpandedRow` uniquement quand ce mode est actif et
// qu'une ligne est en cours de modification.
export function RowFicheContent({ title, onClose, children }: RowFicheContentProps) {
  return (
    <div className="vm-rowexpand-fiche">
      <div className="vm-rowexpand-fiche-header">
        <h4 className="vm-rowexpand-fiche-title">{title}</h4>
        <button type="button" className="vm-rowexpand-fiche-close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      </div>
      <div className="vm-rowexpand-fiche-body">{children}</div>
    </div>
  )
}
