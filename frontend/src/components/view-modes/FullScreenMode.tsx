import type { ViewModeContainerProps } from './types.js'
import './FullScreenMode.css'

// Mode 6 — Plein écran : le formulaire recouvre toute la fenêtre, comme une
// page dédiée à la création/modification, avec un simple bouton « Retour ».
export function FullScreenMode({ open, title, onClose, form, table }: ViewModeContainerProps) {
  return (
    <>
      {table}
      {open && (
        <div className="vm-fullscreen">
          <div className="vm-fullscreen-header">
            <button type="button" className="vm-fullscreen-back" onClick={onClose}>
              ← Retour
            </button>
            <h3 className="vm-fullscreen-title">{title}</h3>
          </div>
          <div className="vm-fullscreen-body">{form}</div>
        </div>
      )}
    </>
  )
}
