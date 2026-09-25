import type { ReactNode } from 'react'
import { GuardBoundary } from './unsaved-changes/UnsavedChangesProvider.js'
import { useConfirmLeave, useGuardScope } from './unsaved-changes/UnsavedChangesContext.js'
import './Modal.css'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

// Modale générique (overlay + panneau) utilisée par chaque feature pour la
// création/modification d'un enregistrement — voir <Entite>Form.tsx et
// <Entite>Page.tsx sous src/features/.
// Fermer par la croix ou le fond demande d'abord quoi faire d'une saisie
// modifiée dans la modale (voir components/unsaved-changes/).
export function Modal({ title, onClose, children }: Props) {
  const scope = useGuardScope()
  const confirmLeave = useConfirmLeave()
  async function requestClose() {
    if (await confirmLeave(scope)) onClose()
  }

  return (
    <div className="modal-overlay" onClick={() => void requestClose()}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={() => void requestClose()} aria-label="Fermer">
            ×
          </button>
        </div>
        <GuardBoundary scope={scope}>{children}</GuardBoundary>
      </div>
    </div>
  )
}
