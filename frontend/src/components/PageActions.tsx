import type { SVGProps } from 'react'
import './PageActions.css'

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true" {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )
}

type Props = {
  onCreate: () => void
  onDelete: () => void
  deleteDisabled: boolean
}

// Barre d'actions "Nouveau" / "Supprimer" utilisée en haut de chaque
// <Entite>Page.tsx sous src/features/, à côté du titre de la table.
export function PageActions({ onCreate, onDelete, deleteDisabled }: Props) {
  return (
    <div className="page-actions">
      <button type="button" className="page-actions-button primary" onClick={onCreate}>
        <PlusIcon />
        Nouveau
      </button>
      <button type="button" className="page-actions-button danger" onClick={onDelete} disabled={deleteDisabled}>
        <TrashIcon />
        Supprimer
      </button>
    </div>
  )
}
