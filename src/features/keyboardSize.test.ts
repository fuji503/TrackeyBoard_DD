import { describe, expect, it } from 'vitest'
import { DEFAULT_KEYBOARD_SIZE, calibrate, resolvePitchPx } from './keyboardSize'

describe('resolvePitchPx', () => {
  it('fit は利用可能幅を列数で割る（上限あり）', () => {
    expect(resolvePitchPx(DEFAULT_KEYBOARD_SIZE, 660, 11)).toBe(60)
    expect(resolvePitchPx(DEFAULT_KEYBOARD_SIZE, 5000, 11)).toBe(100)
  })

  it('manual は mm × px/mm', () => {
    expect(resolvePitchPx({ mode: 'manual', pitchMm: 17, pxPerMm: 4 }, 660, 11)).toBe(68)
  })
})

describe('calibrate', () => {
  it('表示 80px のキーが実測 20mm なら 4px/mm と判定し、17mm (68px) で表示する', () => {
    const size = calibrate(80, 20)
    expect(size).toEqual({ mode: 'manual', pitchMm: 17, pxPerMm: 4 })
    expect(resolvePitchPx(size, 0, 11)).toBe(68)
  })
})
