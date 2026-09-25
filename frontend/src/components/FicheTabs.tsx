import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import './FicheTabs.css'

export type FicheTab<T extends string> = {
  id: T
  label: string
  // Nombre affiché en pastille après le libellé (ex. prestations d'un contrat).
  count?: number
  disabled?: boolean
  // Info-bulle, ex. la raison pour laquelle l'onglet est désactivé.
  title?: string
}

type Props<T extends string> = {
  tabs: readonly FicheTab<T>[]
  value: T
  onChange: (id: T) => void
  ariaLabel?: string
  // Contenu aligné à droite de la barre (ex. bouton « Voir le PDF »).
  actions?: ReactNode
}

// Barre d'onglets commune à toutes les fiches (Personnel, Société,
// Contrat...) : libellés simples, onglet actif souligné. Flèches gauche /
// droite, Début et Fin pour passer d'un onglet à l'autre au clavier.
export function FicheTabs<T extends string>({ tabs, value, onChange, ariaLabel, actions }: Props<T>) {
  const listRef = useRef<HTMLDivElement>(null)

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const enabled = tabs.filter((t) => !t.disabled)
    const index = enabled.findIndex((t) => t.id === value)
    let next: FicheTab<T> | undefined
    if (event.key === 'ArrowRight') next = enabled[(index + 1) % enabled.length]
    else if (event.key === 'ArrowLeft') next = enabled[(index - 1 + enabled.length) % enabled.length]
    else if (event.key === 'Home') next = enabled[0]
    else if (event.key === 'End') next = enabled[enabled.length - 1]
    if (!next) return
    event.preventDefault()
    onChange(next.id)
    listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${next.id}"]`)?.focus()
  }

  return (
    <div className="fiche-tabs">
      <div ref={listRef} className="fiche-tabs-list" role="tablist" aria-label={ariaLabel} onKeyDown={handleKeyDown}>
        {tabs.map((t) => {
          const active = t.id === value
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              data-tab-id={t.id}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              className={`fiche-tab${active ? ' is-active' : ''}`}
              disabled={t.disabled}
              title={t.title}
              onClick={() => onChange(t.id)}
            >
              {t.label}
              {t.count ? <span className="fiche-tab-count">{t.count}</span> : null}
            </button>
          )
        })}
      </div>
      {actions && <div className="fiche-tabs-actions">{actions}</div>}
    </div>
  )
}

// Contenu d'un onglet de fiche : monté à la première visite, puis seulement
// masqué quand on change d'onglet. Une saisie en cours dans un onglet (ex.
// contrat de travail, contact d'une société) n'est ainsi jamais perdue, et
// fermer la fiche la signale toujours (voir components/unsaved-changes/).
export function FichePanel({ active, children }: { active: boolean; children: ReactNode }) {
  const [visited, setVisited] = useState(active)
  if (active && !visited) setVisited(true)
  if (!visited) return null
  return <div hidden={!active}>{children}</div>
}
