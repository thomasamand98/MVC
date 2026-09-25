import { toInputValue } from '../planning/dateUtils.js'
import type { PointageDetail } from './usePointage.js'

// Pointage tel que renvoyé par GET /pointage/feuille
// (backend/src/pointage/pointage.service.ts → getFeuille) : fiche complète,
// plus la couleur et le caractère « travaillé » du statut.
export type PointageFeuille = Omit<PointageDetail, 'TypeStatut'> & {
  TypeStatut: { Libelle_generique: string | null; CouleurStatut: number | null; Statut_de_travail: number | null } | null
}

// Taux horaire du contrat de travail en vigueur (Decimal côté Prisma,
// sérialisés en string).
export type TauxHoraire = {
  Date_application: string | null
  Taux_horaire: string | null
  Taux_horaire_supplementaire: string | null
  Taux_horaire_nuitee: string | null
  Taux_nuitee: string | null
  Taux_samedi: string | null
  Taux_cheque_repas: string | null
  Taux_stanby: string
}

export type Feuille = { pointages: PointageFeuille[]; taux: TauxHoraire | null }

// --- Heures -----------------------------------------------------------------

// Colonne TIME (Heure_*, Debut_pause...) : Prisma la renvoie comme un
// datetime du 01/01/1970 en UTC — seules les heures et minutes comptent.
export function timeMinutes(value: string | null | undefined): number {
  if (!value) return 0
  const [h, m] = value.slice(11, 16).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// Heure locale d'un horodatage (Date_heure_debut / Date_heure_fin).
export function clockTime(value: string | null): string {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// Durée en minutes → « 07:36 » (une journée) ou « 45 h 36 » (un total).
export function formatDuration(minutes: number, style: 'clock' | 'total' = 'clock'): string {
  const sign = minutes < 0 ? '-' : ''
  const abs = Math.abs(Math.round(minutes))
  const h = Math.floor(abs / 60)
  const m = String(abs % 60).padStart(2, '0')
  return style === 'total' ? `${sign}${h} h ${m}` : `${sign}${String(h).padStart(2, '0')}:${m}`
}

// H. total = fin − début.
export function totalMinutes(p: PointageFeuille): number {
  if (!p.Date_heure_debut || !p.Date_heure_fin) return 0
  const ms = new Date(p.Date_heure_fin).getTime() - new Date(p.Date_heure_debut).getTime()
  return ms > 0 ? ms / 60_000 : 0
}

// H. travaillé : Heure_jour quand il est renseigné (journée au forfait, ex.
// 07:36 sans heures de début et de fin), sinon total − coupure − pause.
// Règle déduite de l'écran WinDev et de l'ancienne liste : à ajuster si la
// règle métier diffère.
export function workedMinutes(p: PointageFeuille): number {
  const forfait = timeMinutes(p.Heure_jour)
  if (forfait > 0) return forfait
  const pause = Math.max(timeMinutes(p.Fin_Pause) - timeMinutes(p.Debut_pause), 0)
  return Math.max(totalMinutes(p) - timeMinutes(p.Heure_coupure) - pause, 0)
}

// --- Jours de la feuille ----------------------------------------------------

export type SheetDay = { date: Date; key: string; pointages: PointageFeuille[] }

// Une entrée par jour de la période, avec ses pointages (souvent 0 ou 1).
export function buildDays(days: Date[], pointages: PointageFeuille[]): SheetDay[] {
  const byDay = new Map<string, PointageFeuille[]>()
  for (const p of pointages) {
    const key = p.Date_application?.slice(0, 10)
    if (key) byDay.set(key, [...(byDay.get(key) ?? []), p])
  }
  return days.map((date) => {
    const key = toInputValue(date)
    return { date, key, pointages: byDay.get(key) ?? [] }
  })
}

// Un jour compte comme presté s'il a des heures travaillées ou un statut
// « de travail ».
const isWorked = (p: PointageFeuille) => workedMinutes(p) > 0 || p.TypeStatut?.Statut_de_travail === 1

export type SheetTotals = {
  total: number
  worked: number
  coupure: number
  nuit: number
  liaison: number
  standby: number
  joursPrestes: number
  nuitees: number
  samedis: number
  heuresDimanche: number
}

export function computeTotals(days: SheetDay[]): SheetTotals {
  const totals: SheetTotals = { total: 0, worked: 0, coupure: 0, nuit: 0, liaison: 0, standby: 0, joursPrestes: 0, nuitees: 0, samedis: 0, heuresDimanche: 0 }
  for (const day of days) {
    for (const p of day.pointages) {
      totals.total += totalMinutes(p)
      totals.worked += workedMinutes(p)
      totals.coupure += timeMinutes(p.Heure_coupure)
      totals.nuit += timeMinutes(p.Heure_nuit)
      totals.liaison += timeMinutes(p.Heure_liaison)
      totals.standby += timeMinutes(p.Heure_Stanby)
      if (p.Nuitee === 1) totals.nuitees += 1
      if (day.date.getDay() === 0) totals.heuresDimanche += workedMinutes(p)
    }
    if (day.pointages.some(isWorked)) {
      totals.joursPrestes += 1
      if (day.date.getDay() === 6) totals.samedis += 1
    }
  }
  return totals
}

// Montants de la période à partir des taux du contrat. Chèques repas =
// jours prestés × taux (vérifié sur l'écran WinDev : 6 × 8 € = 48 €) ; les
// autres suivent la même logique quantité × taux. Heures supplémentaires et
// balance ne sont pas calculées : leur règle (heures dues) n'est pas connue.
export function computeAmounts(totals: SheetTotals, taux: TauxHoraire | null) {
  if (!taux) return null
  const rate = (value: string | null) => Number(value ?? 0) || 0
  return {
    chequeRepas: totals.joursPrestes * rate(taux.Taux_cheque_repas),
    nuitees: totals.nuitees * rate(taux.Taux_nuitee),
    heuresNuit: (totals.nuit / 60) * rate(taux.Taux_horaire_nuitee),
    samedis: totals.samedis * rate(taux.Taux_samedi),
    standby: (totals.standby / 60) * rate(taux.Taux_stanby),
  }
}

