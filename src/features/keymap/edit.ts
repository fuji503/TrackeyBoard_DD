import type { Direction } from '../gesture/types'
import type { KeyBinding, Keymap, Layer, PhysicalKey } from '../../types/keymap'
import { layoutBounds } from './view'

/**
 * キーマップの編集操作。すべて元のオブジェクトを変更せず新しいキーマップを返す
 * （エディタの元に戻す/やり直しのため）
 */

function updateBinding(km: Keymap, layerIndex: number, keyIndex: number, fn: (kb: KeyBinding) => KeyBinding): Keymap {
  return {
    ...km,
    layers: km.layers.map((layer, li) =>
      li !== layerIndex
        ? layer
        : { ...layer, bindings: layer.bindings.map((kb, ki) => (ki === keyIndex ? fn(kb ?? {}) : kb)) },
    ),
  }
}

/** 方向のバインディングを設定する。undefined なら削除（下位レイヤーへ透過、ベースでは &none） */
export function setBinding(
  km: Keymap,
  layerIndex: number,
  keyIndex: number,
  dir: Direction,
  binding: string | undefined,
): Keymap {
  return updateBinding(km, layerIndex, keyIndex, (kb) => {
    const next = { ...kb }
    if (binding === undefined) delete next[dir]
    else next[dir] = binding
    return next
  })
}

/** 印字の上書きを設定する。空文字・undefined なら上書きを解除 */
export function setLegend(km: Keymap, layerIndex: number, keyIndex: number, dir: Direction, legend?: string): Keymap {
  return updateBinding(km, layerIndex, keyIndex, (kb) => {
    const next = { ...kb }
    const legends = { ...kb.legend }
    if (legend) legends[dir] = legend
    else delete legends[dir]
    if (Object.keys(legends).length > 0) next.legend = legends
    else delete next.legend
    return next
  })
}

/** 方向をグライド入力にする / フリックに戻す */
export function setGlide(km: Keymap, layerIndex: number, keyIndex: number, dir: Direction, glide: boolean): Keymap {
  return updateBinding(km, layerIndex, keyIndex, (kb) => {
    const next = { ...kb }
    const dirs = (kb.glide ?? []).filter((d) => d !== dir)
    if (glide) dirs.push(dir)
    if (dirs.length > 0) next.glide = dirs
    else delete next.glide
    return next
  })
}

/** キーの位置・大きさ等を変更する */
export function updateKey(km: Keymap, keyIndex: number, patch: Partial<PhysicalKey>): Keymap {
  const keys = km.layout.keys.map((k, i) => {
    if (i !== keyIndex) return k
    const next = { ...k, ...patch }
    if (!next.trackpad) delete next.trackpad
    return next
  })
  return { ...km, layout: { keys } }
}

/** キーを追加する（全レイヤーに空のバインディングを足す）。追加したキーの番号も返す */
export function addKey(km: Keymap, rect: PhysicalKey): { keymap: Keymap; index: number } {
  return {
    keymap: {
      ...km,
      layout: { keys: [...km.layout.keys, rect] },
      layers: km.layers.map((l) => ({ ...l, bindings: [...l.bindings, {}] })),
    },
    index: km.layout.keys.length,
  }
}

/** キーを削除する（全レイヤーから該当キーのバインディングも消す） */
export function removeKeys(km: Keymap, remove: (key: PhysicalKey, index: number) => boolean): Keymap {
  const keep = km.layout.keys.map((k, i) => !remove(k, i))
  return {
    ...km,
    layout: { keys: km.layout.keys.filter((_, i) => keep[i]) },
    layers: km.layers.map((l) => ({ ...l, bindings: l.bindings.filter((_, i) => keep[i]) })),
  }
}

/** 末尾に 1u キーの行を追加する */
export function addRow(km: Keymap): Keymap {
  const { cols, rows } = layoutBounds(km)
  return addKeys(km, Array.from({ length: cols }, (_, x) => ({ x, y: rows, w: 1, h: 1 })))
}

/** 右端に 1u キーの列を追加する */
export function addColumn(km: Keymap): Keymap {
  const { cols, rows } = layoutBounds(km)
  return addKeys(km, Array.from({ length: rows }, (_, y) => ({ x: cols, y, w: 1, h: 1 })))
}

/** 最下行を削除する（最下行から始まるキーを消し、はみ出すキーは縮める） */
export function removeLastRow(km: Keymap): Keymap {
  const { rows } = layoutBounds(km)
  if (rows <= 1) return km
  const last = rows - 1
  const trimmed = removeKeys(km, (k) => k.y >= last)
  return { ...trimmed, layout: { keys: trimmed.layout.keys.map((k) => ({ ...k, h: Math.min(k.h, last - k.y) })) } }
}

/** 右端の列を削除する */
export function removeLastColumn(km: Keymap): Keymap {
  const { cols } = layoutBounds(km)
  if (cols <= 1) return km
  const last = cols - 1
  const trimmed = removeKeys(km, (k) => k.x >= last)
  return { ...trimmed, layout: { keys: trimmed.layout.keys.map((k) => ({ ...k, w: Math.min(k.w, last - k.x) })) } }
}

function addKeys(km: Keymap, rects: PhysicalKey[]): Keymap {
  return rects.reduce((acc, r) => addKey(acc, r).keymap, km)
}

/** 行 × 列の空のキーマップを作る（レイヤー構成は元のキーマップを引き継ぐ） */
export function createGrid(km: Keymap, rows: number, cols: number): Keymap {
  const keys: PhysicalKey[] = []
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) keys.push({ x, y, w: 1, h: 1 })
  const layers: Layer[] = km.layers.map((l) => ({ ...l, bindings: keys.map(() => ({})) }))
  return { ...km, layout: { keys }, layers }
}

/** 重なっているキーの組を返す */
export function findOverlaps(km: Keymap): [number, number][] {
  const keys = km.layout.keys
  const result: [number, number][] = []
  const eps = 1e-6
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i]
      const b = keys[j]
      if (a.x < b.x + b.w - eps && b.x < a.x + a.w - eps && a.y < b.y + b.h - eps && b.y < a.y + a.h - eps) {
        result.push([i, j])
      }
    }
  }
  return result
}

/** 空いている場所（最下行の右、なければ新しい行）に置く 1u キーの位置 */
export function nextFreeRect(km: Keymap): PhysicalKey {
  const { cols, rows } = layoutBounds(km)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const probe = { ...km, layout: { keys: [...km.layout.keys, { x, y, w: 1, h: 1 }] } }
      if (!findOverlaps(probe).some(([, j]) => j === km.layout.keys.length)) return { x, y, w: 1, h: 1 }
    }
  }
  return { x: 0, y: rows, w: 1, h: 1 }
}
