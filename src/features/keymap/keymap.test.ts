import { describe, expect, it } from 'vitest'
import defaultKeymapJson from '../../data/keymaps/trackeyboard-bm-v35.json'
import type { Direction, GestureEvent, GestureKind } from '../gesture/types'
import { activeLayers, behaviorLabel, parseBinding, parseKeymap, resolveBinding } from './binding'
import { INITIAL_ENGINE_STATE, cancelOsSelect, handleGesture, type EngineState } from './engine'
import { formatHid, jisChar, keycodeLabel, lookupKeycode } from './keycodes'

const keymap = parseKeymap(defaultKeymapJson)

/** v3.5 配列のキー番号（行優先） */
const KEY = { Q: 1, W: 2, A: 12, J: 18, ENT: 21, SHIFT: 22, COMMA: 30, CTRL: 32, WIN: 33, MUHENKAN: 35, SPACE: 36, HENKAN: 39 }

const ev = (kind: GestureKind, direction: Direction = 'center'): GestureEvent => ({ kind, direction })

function press(state: EngineState, key: number, kind: GestureKind, dir: Direction = 'center') {
  return handleGesture(state, keymap, key, ev(kind, dir))
}

describe('keycodes', () => {
  it('ZMK の修飾関数を解決する', () => {
    const kc = lookupKeycode('LC(LS(Z))')!
    expect(formatHid(kc, kc.mods)).toBe('KC_LCTL+KC_LSFT+KC_Z')
  })

  it('JIS ホストでの文字', () => {
    expect(jisChar(lookupKeycode('JP_DQT')!, lookupKeycode('JP_DQT')!.mods)).toBe('"')
    expect(jisChar(lookupKeycode('JP_AT')!, 0)).toBe('@')
    expect(jisChar(lookupKeycode('A')!, 0)).toBe('a')
  })

  it('ラベルは英字を大文字、特殊キーは定義名', () => {
    expect(keycodeLabel(lookupKeycode('A')!)).toBe('A')
    expect(keycodeLabel(lookupKeycode('JP_LBRC')!)).toBe('{')
    expect(keycodeLabel(lookupKeycode('BSPC')!)).toBe('BS')
  })
})

describe('既定キーマップ (v3.5)', () => {
  it('検証を通り、全バインディングが解析できる', () => {
    expect(keymap.layout.keys).toHaveLength(43)
  })

  it('キートップ表示が v3.5 の印字と一致する', () => {
    const base = activeLayers(keymap, 'win', false)
    const label = (key: number, dir: Direction) => behaviorLabel(parseBinding(resolveBinding(base, key, dir)))
    expect([label(KEY.Q, 'center'), label(KEY.Q, 'down'), label(KEY.Q, 'left'), label(KEY.Q, 'right')]).toEqual([
      'Q', '1', 'F1', '!',
    ])
    expect([label(KEY.J, 'up'), label(KEY.J, 'down'), label(KEY.J, 'left'), label(KEY.J, 'right')]).toEqual([
      'Home', '[', '{', '}',
    ])
  })

  it('Apple 系 OS では修飾キーが差し替わり、それ以外は下位レイヤーに透過する', () => {
    const mac = activeLayers(keymap, 'mac', false)
    expect(resolveBinding(mac, KEY.WIN, 'center')).toBe('&kp LALT')
    expect(resolveBinding(mac, KEY.Q, 'center')).toBe('&kp Q')
    expect(resolveBinding(activeLayers(keymap, 'win', false), KEY.WIN, 'center')).toBe('&kp LGUI')
  })

  it('変換/無変換は Win/Linux のみ。Mac/iOS/Android は英数/かな (LANG2/LANG1)', () => {
    const at = (os: 'win' | 'mac' | 'ios' | 'android') => {
      const layers = activeLayers(keymap, os, false)
      return [resolveBinding(layers, KEY.MUHENKAN, 'center'), resolveBinding(layers, KEY.HENKAN, 'center')]
    }
    expect(at('win')).toEqual(['&kp JP_MHEN', '&kp JP_HENK'])
    for (const os of ['mac', 'ios', 'android'] as const) expect(at(os)).toEqual(['&kp LANG2', '&kp LANG1'])
  })

  it('Android では修飾キーは Win/Linux と同じ（Opt/Cmd 差し替えは Apple 系のみ）', () => {
    expect(resolveBinding(activeLayers(keymap, 'android', false), KEY.WIN, 'center')).toBe('&kp LGUI')
  })

  it('不正なキーマップはエラー', () => {
    expect(() => parseKeymap({ ...keymap, format: 'x' })).toThrow(/format/)
    const broken = structuredClone(keymap)
    broken.layers[0].bindings[0] = { center: '&kp NOPE' }
    expect(() => parseKeymap(broken)).toThrow(/NOPE/)
  })
})

describe('engine', () => {
  it('タップ・フリックで HID とテキストを出す', () => {
    const r = press(INITIAL_ENGINE_STATE, KEY.Q, 'tap', 'right')
    expect(r.logs[0]).toMatchObject({ action: 'tap', hid: 'KC_LSFT+KC_1', usage: '0x1E', char: '!' })
    expect(r.edits).toEqual([{ type: 'insert', text: '!' }])
  })

  it('Shift ホールド中のタップは修飾付きで送られ、離すとリリース', () => {
    let s = press(INITIAL_ENGINE_STATE, KEY.SHIFT, 'holdStart').state
    const r = press(s, KEY.A, 'tap')
    expect(r.logs[0]).toMatchObject({ hid: 'KC_LSFT+KC_A', char: 'A' })
    s = press(r.state, KEY.SHIFT, 'holdEnd').state
    expect(press(s, KEY.A, 'tap').logs[0].hid).toBe('KC_A')
  })

  it('Ctrl ホールド中はショートカット扱いで文字を入力しない', () => {
    const s = press(INITIAL_ENGINE_STATE, KEY.CTRL, 'holdStart').state
    const r = press(s, KEY.A, 'tap')
    expect(r.logs[0].hid).toBe('KC_LCTL+KC_A')
    expect(r.edits).toEqual([])
  })

  it('文字キーのホールドは連続入力', () => {
    expect(press(INITIAL_ENGINE_STATE, KEY.A, 'holdStart').edits).toHaveLength(1)
    expect(press(INITIAL_ENGINE_STATE, KEY.A, 'holdRepeat').edits).toHaveLength(1)
    expect(press(INITIAL_ENGINE_STATE, KEY.A, 'holdEnd').logs[0].action).toBe('release')
  })

  it('グライド: , で矢印、Ent 左で BS', () => {
    expect(press(INITIAL_ENGINE_STATE, KEY.COMMA, 'glide', 'left').edits).toEqual([{ type: 'move', to: 'left' }])
    expect(press(INITIAL_ENGINE_STATE, KEY.ENT, 'glide', 'left').logs[0].hid).toBe('KC_BSPC')
  })

  it('OS 切替: Ctrl 上フリック → W で Mac。Apple レイヤーが有効になる', () => {
    let r = press(INITIAL_ENGINE_STATE, KEY.CTRL, 'tap', 'up')
    expect(r.state.osSelect).toBe(true)
    r = press(r.state, KEY.W, 'tap')
    expect(r.state).toMatchObject({ os: 'mac', osSelect: false })
    expect(press(r.state, KEY.WIN, 'tap').logs[0].hid).toBe('KC_LALT')
  })

  it('OS 切替待機中に他のキーやタイムアウトでキャンセル（文字は入力しない）', () => {
    const waiting = press(INITIAL_ENGINE_STATE, KEY.CTRL, 'tap', 'up').state
    const r = press(waiting, KEY.A, 'tap')
    expect(r.state).toMatchObject({ os: 'win', osSelect: false })
    expect(r.edits).toEqual([])
    expect(cancelOsSelect(waiting).state.osSelect).toBe(false)
  })
})
