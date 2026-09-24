import { useEffect, useState } from 'react'
import './TableSearch.css'

// Délai après la dernière frappe avant de lancer la recherche — évite une
// requête serveur par caractère tapé.
const DEBOUNCE_MS = 300

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </svg>
  )
}

type Props = {
  value: string
  onChange: (value: string) => void
}

// Champ « Rechercher » au-dessus des tableaux (voir CrudPage.tsx) : garde
// sa propre saisie pour rester fluide et ne transmet `onChange` qu'une fois
// la frappe terminée (ou immédiatement à l'effacement via la croix).
export function TableSearch({ value, onChange }: Props) {
  const [input, setInput] = useState(value)

  useEffect(() => {
    if (input === value) return
    const timer = setTimeout(() => onChange(input), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [input, value, onChange])

  function clear() {
    setInput('')
    onChange('')
  }

  return (
    <div className="table-search">
      <SearchIcon />
      <input
        type="search"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') clear()
        }}
        placeholder="Rechercher..."
        aria-label="Rechercher dans toutes les colonnes"
      />
      {input && (
        <button type="button" className="table-search-clear" onClick={clear} aria-label="Effacer la recherche">
          ×
        </button>
      )}
    </div>
  )
}
