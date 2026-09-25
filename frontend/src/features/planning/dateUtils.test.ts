import { describe, expect, it } from 'vitest'
import { daysInRange, fromInputValue, layoutLanes, snapMinutes, toInputValue } from './dateUtils.js'

describe('toInputValue / fromInputValue', () => {
  it('fait l’aller-retour d’un jour local', () => {
    const date = new Date(2026, 0, 5)
    expect(toInputValue(date)).toBe('2026-01-05')
    expect(fromInputValue('2026-01-05')).toEqual(date)
  })

  it('refuse une valeur incomplète', () => {
    expect(fromInputValue('')).toBeNull()
    expect(fromInputValue('2026-01')).toBeNull()
  })
})

describe('daysInRange', () => {
  it('inclut les deux bornes', () => {
    expect(daysInRange(new Date(2026, 8, 28), new Date(2026, 9, 1)).map(toInputValue)).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
    ])
  })
})

describe('snapMinutes', () => {
  it('arrondit au quart d’heure le plus proche', () => {
    expect(snapMinutes(7)).toBe(0)
    expect(snapMinutes(8)).toBe(15)
    expect(snapMinutes(52)).toBe(45)
  })
})

describe('layoutLanes', () => {
  it('met côte à côte les éléments qui se chevauchent', () => {
    const lanes = layoutLanes([
      { id: 'a', start: 0, end: 60 },
      { id: 'b', start: 30, end: 90 },
      { id: 'c', start: 60, end: 120 },
      { id: 'd', start: 200, end: 260 },
    ])
    expect(lanes.get('a')).toEqual({ lane: 0, lanes: 2 })
    expect(lanes.get('b')).toEqual({ lane: 1, lanes: 2 })
    // c réutilise le couloir de a, terminé avant son début.
    expect(lanes.get('c')).toEqual({ lane: 0, lanes: 2 })
    // d ne chevauche rien : seul dans son groupe.
    expect(lanes.get('d')).toEqual({ lane: 0, lanes: 1 })
  })
})
