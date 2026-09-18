import type { ViewModeContainerProps } from './types.js'
import './BottomSheetMode.css'

// Mode 5 — Panneau du bas ("bottom sheet"), style mobile : glisse depuis le
// bas de l'écran sur toute la largeur, plutôt que sur le côté.
export function BottomSheetMode({ open, title, onClose, form, table }: ViewModeContainerProps) {
  return (
    <div className="vm-sheet-layout">
      {table}
      <div className={`vm-sheet-backdrop${open ? ' open' : ''}`} onClick={onClose} aria-hidden="true" />
      <div className={`vm-sheet${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="vm-sheet-handle" aria-hidden="true" />
        <div className="vm-sheet-header">
          <h3 className="vm-sheet-title">{title}</h3>
          <button type="button" className="vm-sheet-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <div className="vm-sheet-body">{form}</div>
      </div>
    </div>
  )
}
