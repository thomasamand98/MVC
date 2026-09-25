// Couleurs WinDev (Marchandise.CouleurPlanning, TypeStatut.CouleurStatut...) :
// un entier renvoyé par la fonction RGB() de WinDev, R + G×256 + B×65536
// (ordre BGR d'un COLORREF Windows), entre 0 et 16 777 215. 0 (noir) est la
// valeur par défaut des colonnes, traitée comme « pas de couleur ».
// Pendant côté frontend : frontend/src/lib/windevColor.ts.
export function windevColorToHex(value: bigint | number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0 || n > 0xffffff) return null;
  const hex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${hex(n & 0xff)}${hex((n >> 8) & 0xff)}${hex((n >> 16) & 0xff)}`;
}
