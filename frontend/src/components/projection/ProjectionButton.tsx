import { useEffect, useRef, useState } from 'react'
import { ENTITIES, type EntityKey, type Relation } from './relations.js'
import './ProjectionButton.css'

function ProjectionIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="7" height="6" rx="1.5" />
      <rect x="14" y="14" width="7" height="6" rx="1.5" />
      <path d="M6.5 10v4.5a2 2 0 0 0 2 2H14" />
      <path d="M11.5 14.5l2.5 2-2.5 2" />
    </svg>
  )
}

type Props = {
  relations: Relation[]
  // Nombre de lignes sélectionnées — 0 désactive le bouton.
  selectedCount: number
  onSelect: (target: EntityKey) => void
}

// Bouton « Projection » à côté de Nouveau/Modifier/Supprimer (voir
// CrudPage.tsx) : ouvre la liste des tables liées ; en choisir une affiche
// ses enregistrements liés aux lignes sélectionnées dans un nouvel onglet.
export function ProjectionButton({ relations, selectedCount, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Ferme le menu au clic ailleurs ou à Échap.
  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const disabled = selectedCount === 0

  return (
    <div className="projection" ref={rootRef}>
      <button
        type="button"
        className="btn"
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title={disabled ? 'Sélectionnez au moins une ligne' : undefined}
      >
        <ProjectionIcon />
        Projection
      </button>
      {open && !disabled && (
        <div className="projection-menu" role="menu">
          <div className="projection-menu-title">
            {selectedCount} ligne{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
          </div>
          {relations.map((relation) => (
            <button
              key={relation.target}
              type="button"
              role="menuitem"
              className="projection-menu-item"
              onClick={() => {
                setOpen(false)
                onSelect(relation.target)
              }}
            >
              {ENTITIES[relation.target].title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
