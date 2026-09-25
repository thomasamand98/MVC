import { describe, expect, it } from 'vitest'
import { buildDays, computeAmounts, computeTotals, formatDuration, timeMinutes, workedMinutes, type PointageFeuille, type TauxHoraire } from './feuille.js'

// Colonne TIME telle que renvoyée par Prisma.
const time = (hhmm: string) => `1970-01-01T${hhmm}:00.000Z`

function pointage(overrides: Partial<PointageFeuille>): PointageFeuille {
  return {
    Date_application: null,
    Date_heure_debut: null,
    Date_heure_fin: null,
    Heure_jour: null,
    Heure_coupure: null,
    Debut_pause: null,
    Fin_Pause: null,
    Heure_nuit: null,
    Heure_liaison: null,
    Heure_Stanby: null,
    Nuitee: null,
    TypeStatut: null,
    ...overrides,
  } as PointageFeuille
}

describe('timeMinutes', () => {
  it('lit heures et minutes d’une colonne TIME', () => {
    expect(timeMinutes(time('07:36'))).toBe(456)
  })

  it('vaut 0 sans valeur', () => {
    expect(timeMinutes(null)).toBe(0)
    expect(timeMinutes(undefined)).toBe(0)
  })
})

describe('formatDuration', () => {
  it('formate une journée et un total', () => {
    expect(formatDuration(456)).toBe('07:36')
    expect(formatDuration(2736, 'total')).toBe('45 h 36')
  })

  it('garde le signe d’une durée négative', () => {
    expect(formatDuration(-90)).toBe('-01:30')
  })
})

describe('workedMinutes', () => {
  it('prend le forfait Heure_jour quand il est renseigné', () => {
    const p = pointage({ Heure_jour: time('07:36'), Date_heure_debut: '2026-09-21T06:00:00Z', Date_heure_fin: '2026-09-21T18:00:00Z' })
    expect(workedMinutes(p)).toBe(456)
  })

  it('retire coupure et pause du total', () => {
    const p = pointage({
      Date_heure_debut: '2026-09-21T06:00:00Z',
      Date_heure_fin: '2026-09-21T16:00:00Z',
      Heure_coupure: time('00:45'),
      Debut_pause: time('12:00'),
      Fin_Pause: time('12:30'),
    })
    expect(workedMinutes(p)).toBe(600 - 45 - 30)
  })

  it('ne descend jamais sous zéro', () => {
    const p = pointage({ Date_heure_debut: '2026-09-21T06:00:00Z', Date_heure_fin: '2026-09-21T06:30:00Z', Heure_coupure: time('01:00') })
    expect(workedMinutes(p)).toBe(0)
  })
})

describe('computeTotals / computeAmounts', () => {
  // Samedi 19 et dimanche 20 septembre 2026, lundi 21 sans pointage.
  const days = [new Date(2026, 8, 19), new Date(2026, 8, 20), new Date(2026, 8, 21)]
  const pointages = [
    pointage({ Date_application: '2026-09-19T00:00:00.000Z', Heure_jour: time('08:00'), Nuitee: 1, Heure_nuit: time('02:00') }),
    pointage({ Date_application: '2026-09-20T00:00:00.000Z', Heure_jour: time('04:00'), Heure_Stanby: time('01:30') }),
  ]
  const totals = computeTotals(buildDays(days, pointages))

  it('range les pointages par jour', () => {
    expect(buildDays(days, pointages).map((d) => d.pointages.length)).toEqual([1, 1, 0])
  })

  it('compte jours prestés, samedis, dimanches et nuitées', () => {
    expect(totals).toMatchObject({ worked: 720, joursPrestes: 2, samedis: 1, heuresDimanche: 240, nuitees: 1, nuit: 120, standby: 90 })
  })

  it('calcule les montants à partir des taux', () => {
    const taux = { Taux_cheque_repas: '8', Taux_nuitee: '30', Taux_horaire_nuitee: '2.5', Taux_samedi: '10', Taux_stanby: '4' } as TauxHoraire
    expect(computeAmounts(totals, taux)).toEqual({ chequeRepas: 16, nuitees: 30, heuresNuit: 5, samedis: 10, standby: 6 })
  })

  it('ne calcule rien sans contrat', () => {
    expect(computeAmounts(totals, null)).toBeNull()
  })
})
