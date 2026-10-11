import type { Keymap } from '../../types/keymap'
import { DEFAULT_KEYMAP } from '.'

/**
 * 古い版（v0.4 以前）で保存・エクスポートしたキーマップを現在の形式に揃える。
 * トラックパッド / トラックポイントのレイヤーが無ければ追加する。
 * 配列が既定（v3.5）と同じなら、既定のボタン割り当てと VTP 位置を引き継ぐ。
 */
export function migrateKeymap(km: Keymap): Keymap {
  const hasModeLayers = km.layers.some((l) => l.activation.type === 'mode')
  if (hasModeLayers) return km
  const sameLayout = JSON.stringify(km.layout.keys) === JSON.stringify(DEFAULT_KEYMAP.layout.keys)
  const modeLayers = DEFAULT_KEYMAP.layers
    .filter((l) => l.activation.type === 'mode')
    .map((l) => (sameLayout ? l : { ...l, bindings: km.layout.keys.map(() => ({})) }))
  return {
    ...km,
    layout: sameLayout && !km.layout.vtp ? { ...km.layout, vtp: DEFAULT_KEYMAP.layout.vtp } : km.layout,
    layers: [...km.layers, ...modeLayers],
  }
}
