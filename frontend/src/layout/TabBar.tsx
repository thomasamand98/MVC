import { useState } from 'react'
import './TabBar.css'

type Tab = { id: string; label: string }

type Props = {
  tabs: Tab[]
  activeId: string
  onSelect: (id: string) => void
  onClose: (id: string) => void
  // Nouvel ordre des ids après un glisser-déposer — voir AppLayout.tsx, qui
  // n'a qu'à remplacer sa liste `openTabIds` par celle reçue.
  onReorder: (ids: string[]) => void
}

// Barre d'onglets façon navigateur, au-dessus de la page active (voir
// AppLayout.tsx) — un onglet par page ouverte depuis le menu latéral.
// Cliquer sur son libellé l'active, la croix le ferme, on peut les
// réordonner par glisser-déposer (Drag and Drop natif du navigateur, pas de
// librairie). Toujours affichée, même avec un seul onglet ouvert.
export function TabBar({ tabs, activeId, onSelect, onClose, onReorder }: Props) {
  // Id de l'onglet en cours de glissement, et celui actuellement survolé
  // (pour l'indicateur visuel de dépôt) — locaux à la barre, sans lien avec
  // l'onglet actif.
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  function handleDrop(targetId: string) {
    if (draggedId && draggedId !== targetId) {
      const fromIndex = tabs.findIndex((t) => t.id === draggedId)
      const toIndex = tabs.findIndex((t) => t.id === targetId)
      if (fromIndex !== -1 && toIndex !== -1) {
        const reordered = [...tabs]
        const [moved] = reordered.splice(fromIndex, 1)
        reordered.splice(toIndex, 0, moved)
        onReorder(reordered.map((t) => t.id))
      }
    }
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <div className="tab-bar" role="tablist">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={[
            'tab-bar-tab',
            tab.id === activeId && 'active',
            tab.id === draggedId && 'dragging',
            tab.id === dragOverId && tab.id !== draggedId && 'drag-over',
          ].filter(Boolean).join(' ')}
          role="tab"
          aria-selected={tab.id === activeId}
          draggable
          onDragStart={(e) => {
            setDraggedId(tab.id)
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragEnd={() => {
            setDraggedId(null)
            setDragOverId(null)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            if (draggedId && draggedId !== tab.id) setDragOverId(tab.id)
          }}
          onDragLeave={() => setDragOverId((prev) => (prev === tab.id ? null : prev))}
          onDrop={(e) => {
            e.preventDefault()
            handleDrop(tab.id)
          }}
        >
          <button type="button" className="tab-bar-tab-label" onClick={() => onSelect(tab.id)}>
            {tab.label}
          </button>
          <button
            type="button"
            className="tab-bar-tab-close"
            onClick={(e) => { e.stopPropagation(); onClose(tab.id) }}
            aria-label={`Fermer l'onglet ${tab.label}`}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
