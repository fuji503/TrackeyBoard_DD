import { describe, expect, it } from 'vitest'
import { DEFAULT_KEYMAP } from '../../data/keymaps'
import { parseBinding, parseKeymap } from './binding'
import {
  addColumn,
  addKey,
  addRow,
  createGrid,
  findOverlaps,
  nextFreeRect,
  removeKeys,
  removeLastColumn,
  removeLastRow,
  setBinding,
  setGlide,
  setLegend,
  setVtp,
  updateKey,
  vtpPointOf,
} from './edit'
import { PALETTE, wrapModifiers } from './palette'
import { keyAt, layoutBounds, nearestKey } from './view'

const km = DEFAULT_KEYMAP
const Q = 1

describe('バインディング編集', () => {
  it('設定・削除し、元のキーマップは変更しない', () => {
    const edited = setBinding(km, 0, Q, 'up', '&kp LC(C)')
    expect(edited.layers[0].bindings[Q].up).toBe('&kp LC(C)')
    expect(km.layers[0].bindings[Q].up).toBeUndefined()
    expect(setBinding(edited, 0, Q, 'up', undefined).layers[0].bindings[Q].up).toBeUndefined()
  })

  it('印字の上書きは空にすると legend ごと消える', () => {
    const edited = setLegend(km, 0, Q, 'up', undefined)
    expect(edited.layers[0].bindings[Q].legend).toBeUndefined()
    expect(setLegend(km, 0, Q, 'center', 'きゅー').layers[0].bindings[Q].legend).toEqual({ up: '(Win)', center: 'きゅー' })
  })

  it('グライド方向の切り替え', () => {
    const on = setGlide(km, 0, Q, 'left', true)
    expect(on.layers[0].bindings[Q].glide).toEqual(['left'])
    expect(setGlide(on, 0, Q, 'left', false).layers[0].bindings[Q].glide).toBeUndefined()
  })
})

describe('配列編集', () => {
  it('キーの追加・削除で全レイヤーのバインディング数が揃い、検証を通る', () => {
    const { keymap: added, index } = addKey(km, nextFreeRect(km))
    expect(index).toBe(43)
    expect(added.layers.every((l) => l.bindings.length === 44)).toBe(true)
    // v3.5 は Ent の下 (10, 2) が空いている…が Ent が縦2マスなので埋まっている → 新しい行へ
    expect(added.layout.keys[43]).toEqual({ x: 0, y: 4, w: 1, h: 1 })
    const removed = removeKeys(added, (_, i) => i === 0)
    expect(removed.layers.every((l) => l.bindings.length === 43)).toBe(true)
    expect(() => parseKeymap(removed)).not.toThrow()
  })

  it('行・列の追加と削除', () => {
    expect(layoutBounds(addRow(km))).toEqual({ cols: 11, rows: 5 })
    expect(layoutBounds(addColumn(km))).toEqual({ cols: 12, rows: 4 })
    const fewer = removeLastRow(km)
    expect(layoutBounds(fewer)).toEqual({ cols: 11, rows: 3 })
    expect(fewer.layout.keys).toHaveLength(32)
    const narrower = removeLastColumn(km)
    expect(layoutBounds(narrower)).toEqual({ cols: 10, rows: 4 })
  })

  it('最下行を消すと縦長キーははみ出さないよう縮む', () => {
    const three = removeLastRow(removeLastRow(km)) // 2行: Ent (y=1,h=2) → h=1
    expect(three.layout.keys.find((k) => k.x === 10 && k.y === 1)?.h).toBe(1)
  })

  it('グリッドから新規作成', () => {
    const grid = createGrid(km, 2, 3)
    expect(grid.layout.keys).toHaveLength(6)
    expect(grid.layers).toHaveLength(km.layers.length)
    expect(() => parseKeymap(grid)).not.toThrow()
  })

  it('配列を編集しても VTP 位置は保たれる', () => {
    expect(addRow(km).layout.vtp).toEqual(km.layout.vtp)
    expect(updateKey(km, 0, { w: 2 }).layout.vtp).toEqual(km.layout.vtp)
    expect(removeLastColumn(km).layout.vtp).toEqual(km.layout.vtp)
  })

  it('VTP の位置はキーの8方向から決める', () => {
    // G (x=5, y=1) の右下 = G/H/B/N の交点
    expect(vtpPointOf(km.layout.keys[16], 'downRight')).toEqual({ x: 6, y: 2 })
    expect(setVtp(km, undefined).layout.vtp).toBeUndefined()
  })

  it('重なりの検出', () => {
    expect(findOverlaps(km)).toEqual([])
    expect(findOverlaps(updateKey(km, 0, { w: 1.5 }))).toEqual([[0, 1]])
  })
})

describe('palette', () => {
  it('一覧のバインディングはすべて解析でき、修飾関数を付けられる', () => {
    for (const g of PALETTE) for (const b of g.bindings) expect(() => parseBinding(b)).not.toThrow()
    expect(wrapModifiers('&kp C', ['LC', 'LS'])).toBe('&kp LC(LS(C))')
    expect(wrapModifiers('&none', ['LC'])).toBe('&none')
  })
})

describe('keyAt / nearestKey', () => {
  it('座標のキーと、VTP（角）に最も近いキー', () => {
    expect(keyAt(km, 5.5, 1.5)).toBe(16) // G
    expect(keyAt(km, 10.5, 2.5)).toBe(21) // Ent（縦2マス）
    expect(keyAt(km, 50, 50)).toBeNull()
    expect(nearestKey(km, 5.9, 1.95)).toBe(16) // 交点の少し左上 → G
    expect(nearestKey(km, 6.1, 2.05)).toBe(28) // 少し右下 → N
  })
})
