import type { ViewModeContainerProps } from './types.js'
import './DrawerMode.css'

// Mode 2 — Panneau latéral ("fiche"), glisse depuis la droite sur toute la
// hauteur, au-dessus du tableau (qui reste visible en arrière-plan assombri).
export function DrawerMode({ open, title, onClose, form, table }: ViewModeContainerProps) {
  return (
    <div className="vm-drawer-layout">
      {table}
      <div className={`vm-drawer-backdrop${open ? ' open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`vm-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        <div className="vm-drawer-header">
          <h3 className="vm-drawer-title">{title}</h3>
          <button type="button" className="vm-drawer-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        <div className="vm-drawer-body">{form}</div>
      </aside>
    </div>
  )
}
