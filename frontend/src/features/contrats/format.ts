// Formats d'affichage partagés par les onglets de la fiche contrat.

// "2024-07-01T00:00:00.000Z" → "01/07/2024". Découpé à la main plutôt que via
// `new Date(...)` : les colonnes `Date` de la base sont à minuit UTC et
// seraient décalées d'un jour dans un fuseau négatif.
export function formatDate(value: string | null): string {
  if (!value) return '—'
  return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`
}

const euro = new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 4 })

// Les Decimal Prisma arrivent en string ("1234.500000").
export function formatEuro(value: string | number | null): string {
  if (value === null || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? euro.format(amount) : '—'
}
