import type { ViewModeContainerProps } from './types.js'
import './SplitViewMode.css'

// Mode 4 — Vue divisée (maître-détail) : le formulaire occupe une colonne
// fixe à droite du tableau en permanence, plutôt qu'une fenêtre séparée.
export function SplitViewMode({ open, title, onClose, form, table }: ViewModeContainerProps) {
  return (
    <div className="vm-split">
      <div className="vm-split-table">{table}</div>
      <aside className="vm-split-panel">
        {open ? (
          <>
            <div className="vm-split-header">
              <h3 className="vm-split-title">{title}</h3>
              <button type="button" className="vm-split-close" onClick={onClose} aria-label="Fermer">
                ×
              </button>
            </div>
            <div className="vm-split-body">{form}</div>
          </>
        ) : (
          <div className="vm-split-empty">
            <p>Sélectionnez une ligne (modification) ou cliquez sur « Nouveau » pour afficher la fiche ici.</p>
          </div>
        )}
      </aside>
    </div>
  )
}
