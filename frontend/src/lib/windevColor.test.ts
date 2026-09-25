import { describe, expect, it } from 'vitest'
import { hexToWindevColor, windevColorToHex } from './windevColor.js'

describe('couleurs WinDev', () => {
  it('convertit un entier BGR en #rrggbb', () => {
    // RGB(255, 128, 0) = 255 + 128×256
    expect(windevColorToHex(255 + 128 * 256)).toBe('#ff8000')
    expect(windevColorToHex('16711680')).toBe('#0000ff')
  })

  it('traite 0, vide et hors plage comme « pas de couleur »', () => {
    expect(windevColorToHex(0)).toBeNull()
    expect(windevColorToHex('')).toBeNull()
    expect(windevColorToHex(0x1000000)).toBeNull()
  })

  it('fait l’aller-retour depuis un <input type="color">', () => {
    expect(windevColorToHex(hexToWindevColor('#12abef'))).toBe('#12abef')
    expect(hexToWindevColor('invalide')).toBe(0)
  })
})
