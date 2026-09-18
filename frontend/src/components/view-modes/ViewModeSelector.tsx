import { viewModes } from './index.js'
import './ViewModeSelector.css'

type Props = {
  value: string
  onChange: (id: string) => void
}

// Sélecteur affiché en haut de chaque page tableau (voir CrudPage.tsx) —
// permet de choisir, pour toutes les pages, comment la saisie/l'affichage
// d'un enregistrement est présenté (modale, panneau latéral, ...). Le choix
// est mémorisé par useViewModePreference.
export function ViewModeSelector({ value, onChange }: Props) {
  return (
    <div className="view-mode-selector" role="radiogroup" aria-label="Mode de saisie et d'affichage">
      {viewModes.map((m) => {
        const Icon = m.icon
        return (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={value === m.id}
            className={`view-mode-selector-button${value === m.id ? ' active' : ''}`}
            onClick={() => onChange(m.id)}
            title={m.description}
          >
            <Icon />
            <span>{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
