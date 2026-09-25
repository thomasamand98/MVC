import { toInputValue } from '../features/planning/dateUtils.js'

// Période d'une liste, en jours « AAAA-MM-JJ » (bornes incluses) — envoyée
// telle quelle en ?from=&to= (voir parsePeriod, backend/src/common/params.ts).
// null = toutes les dates. Sélecteur : components/PeriodFilter.tsx.
export type Period = { from: string; to: string } | null

// Période d'un seul jour : aujourd'hui.
export function todayPeriod(): Period {
  const today = toInputValue(new Date())
  return { from: today, to: today }
}

// Filtres ?from=&to= à passer au hook de la liste (voir useApiList.ts).
export function periodFilters(period: Period): Record<string, string> {
  return period ? { from: period.from, to: period.to } : {}
}
