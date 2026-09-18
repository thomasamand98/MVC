import type { ViewModeContainerProps } from './types.js'
import './InlinePanelMode.css'

// Mode 3 — Bloc rétractable en haut de page : le formulaire s'ouvre dans un
// panneau qui pousse le tableau vers le bas, au lieu de le recouvrir.
export function InlinePanelMode({ open, title, onClose, form, table }: ViewModeContainerProps) {
  return (
    <div className="vm-inline">
      <div className={`vm-inline-panel${open ? ' open' : ''}`}>
        <div className="vm-inline-panel-inner">
          <div className="vm-inline-header">
            <h3 className="vm-inline-title">{title}</h3>
            <button type="button" className="vm-inline-close" onClick={onClose} aria-label="Fermer">
              ×
            </button>
          </div>
          <div className="vm-inline-body">{form}</div>
        </div>
      </div>
      {table}
    </div>
  )
}
