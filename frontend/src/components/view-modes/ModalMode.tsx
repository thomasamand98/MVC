import { Modal } from '../Modal.js'
import type { ViewModeContainerProps } from './types.js'

// Mode 1 — Modale (comportement actuel de CrudPage, inchangé). Sert de
// référence pour comparer les autres modes. Pour la garder comme seule
// option définitive : voir README.md de ce dossier.
export function ModalMode({ open, title, onClose, form, table }: ViewModeContainerProps) {
  return (
    <>
      {table}
      {open && (
        <Modal title={title} onClose={onClose}>
          {form}
        </Modal>
      )}
    </>
  )
}
