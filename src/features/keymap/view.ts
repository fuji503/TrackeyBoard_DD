import type { BindingSlots, Keymap, PhysicalKey } from '../../types/keymap'
import { SLIDE_DIRECTIONS, type Direction } from '../gesture/types'
import { behaviorLabel, parseBinding } from './binding'

/** キーボード描画用の1キー分の情報 */
export interface KeyView {
  index: number
  rect: PhysicalKey
  /** 印字（ベースレイヤー） */
  legends: BindingSlots
  /** OS 別レイヤーの印字（赤字。例: Win キーの [Opt]） */
  subLegend?: string
  glide: Direction[]
  trackpad: boolean
}

const DIRECTIONS: Direction[] = ['center', ...SLIDE_DIRECTIONS]

function slotLegend(slots: BindingSlots & { legend?: BindingSlots }, dir: Direction): string | undefined {
  const override = slots.legend?.[dir]
  if (override !== undefined) return override
  const binding = slots[dir]
  return binding ? behaviorLabel(parseBinding(binding)) : undefined
}

export function buildKeyViews(keymap: Keymap): KeyView[] {
  const base = keymap.layers.find((l) => l.activation.type === 'always') ?? keymap.layers[0]
  const osLayers = keymap.layers.filter((l) => l.activation.type === 'os')

  return keymap.layout.keys.map((rect, index) => {
    const kb = base.bindings[index] ?? {}
    const legends: BindingSlots = {}
    for (const dir of DIRECTIONS) legends[dir] = slotLegend(kb, dir)
    const subLegend = osLayers.map((l) => slotLegend(l.bindings[index] ?? {}, 'center')).find(Boolean)
    return { index, rect, legends, subLegend, glide: kb.glide ?? [], trackpad: rect.trackpad ?? false }
  })
}

/** レイアウト全体の大きさ（単位: キー） */
export function layoutBounds(keymap: Keymap): { cols: number; rows: number } {
  const keys = keymap.layout.keys
  return {
    cols: Math.max(1, ...keys.map((k) => k.x + k.w)),
    rows: Math.max(1, ...keys.map((k) => k.y + k.h)),
  }
}
