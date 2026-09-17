import type { ReactNode } from 'react'
import './Modal.css'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

// Modale générique (overlay + panneau) utilisée par chaque feature pour la
// création/modification d'un enregistrement — voir <Entite>Form.tsx et
// <Entite>Page.tsx sous src/features/.
export function Modal({ title, onClose, children }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
