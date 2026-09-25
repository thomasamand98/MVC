// Couleurs WinDev (Marchandise.CouleurPlanning, TypeStatut.CouleurStatut...) :
// un entier renvoyé par la fonction RGB() de WinDev, R + G×256 + B×65536
// (ordre BGR d'un COLORREF Windows), entre 0 et 16 777 215. 0 (noir) est la
// valeur par défaut des colonnes, traitée comme « pas de couleur ».
// Pendant côté backend : backend/src/common/windev-color.ts.

// Entier WinDev (nombre, ou texte pour les colonnes BigInt sérialisées) →
// « #rrggbb » ; null si pas de couleur.
export function windevColorToHex(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!Number.isInteger(n) || n <= 0 || n > 0xffffff) return null
  const hex = (c: number) => c.toString(16).padStart(2, '0')
  return `#${hex(n & 0xff)}${hex((n >> 8) & 0xff)}${hex((n >> 16) & 0xff)}`
}

// « #rrggbb » (valeur d'un <input type="color">) → entier WinDev.
export function hexToWindevColor(hex: string): number {
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!match) return 0
  const [r, g, b] = match.slice(1).map((c) => parseInt(c, 16))
  return r + g * 256 + b * 65536
}
