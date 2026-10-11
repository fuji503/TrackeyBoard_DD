import { describe, expect, it } from 'vitest'
import { DEFAULT_KEYMAP } from '../../data/keymaps'
import { parseKeymap } from './binding'
import { keymapFileName, serializeKeymap } from './serialize'

describe('serializeKeymap', () => {
  it('JSON として読み戻すと同じ内容（設定値も含む）', () => {
    const km = { ...DEFAULT_KEYMAP, settings: { gesture: { holdDelay: 500, glideStep: 0.75 } } }
    expect(parseKeymap(JSON.parse(serializeKeymap(km)))).toEqual(km)
  })

  it('不正な設定値はエラー', () => {
    const km = { ...DEFAULT_KEYMAP, settings: { gesture: { holdDelay: 'x' } } }
    expect(() => parseKeymap(JSON.parse(JSON.stringify(km)))).toThrow(/holdDelay/)
  })
})

describe('keymapFileName', () => {
  it('キーマップ名をファイル名にし、使えない文字は置き換える', () => {
    expect(keymapFileName('TrackeyBoard BM 配列 v3.5')).toBe('TrackeyBoard BM 配列 v3.5.json')
    expect(keymapFileName('a/b:c?')).toBe('a_b_c_.json')
    expect(keymapFileName('my.json')).toBe('my.json')
    expect(keymapFileName('  ')).toBe('keymap.json')
  })
})
