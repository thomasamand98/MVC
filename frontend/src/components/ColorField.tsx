import { hexToWindevColor, windevColorToHex } from '../lib/windevColor.js'
import './ColorField.css'

type Props = {
  // Couleur WinDev (entier, voir lib/windevColor.ts) ; 0 = pas de couleur.
  value: number
  onChange: (value: number) => void
  label: string
}

// Pastille de couleur : un clic ouvre la palette native du navigateur
// (<input type="color"> posé, transparent, sur la pastille) ; la valeur est
// lue et renvoyée en entier WinDev, tel que stocké en base. « × » efface la
// couleur (0).
export function ColorField({ value, onChange, label }: Props) {
  const hex = windevColorToHex(value)

  return (
    <span className="color-field">
      <span className={`color-field-swatch${hex ? '' : ' color-field-swatch--none'}`} style={hex ? { background: hex } : undefined}>
        <input
          type="color"
          aria-label={label}
          title={hex ? `${label} : ${hex}` : `${label} : aucune`}
          value={hex ?? '#000000'}
          onChange={(e) => onChange(hexToWindevColor(e.target.value))}
        />
      </span>
      {hex && (
        <button type="button" className="color-field-clear" onClick={() => onChange(0)} title="Retirer la couleur" aria-label={`Retirer ${label.toLowerCase()}`}>
          ×
        </button>
      )}
    </span>
  )
}

// Pastille en lecture seule (tableaux, listes) ; rien si pas de couleur.
export function ColorSwatch({ value }: { value: number | string | null | undefined }) {
  const hex = windevColorToHex(value)
  if (!hex) return null
  return <span className="color-swatch" style={{ background: hex }} title={hex} aria-label={`Couleur ${hex}`} />
}
