import type { Direction } from '../features/gesture/types'

/**
 * TrackeyBoard キーマップ（JSON でエクスポート/インポートする形式）。
 * ZMK の概念に合わせている:
 * - layout: 物理レイアウト（ZMK の physical layout）。単位は 1u = 1 キーピッチ
 * - layers: レイヤー。bindings は layout.keys と同じ順・同じ数
 * - バインディングは ZMK の記法の文字列（"&kp A", "&kp LS(N1)", "&trans" など）
 *
 * ZMK に無い TrackeyBoard 固有の概念として、1キーにジェスチャー方向ごとの
 * バインディング（center=タップ, up/down/left/right=フリック/グライド）を持つ。
 */
export interface Keymap {
  format: typeof KEYMAP_FORMAT
  version: 1
  name: string
  layout: PhysicalLayout
  layers: Layer[]
}

export const KEYMAP_FORMAT = 'trackeyboard-keymap'

export interface PhysicalLayout {
  keys: PhysicalKey[]
}

export interface PhysicalKey {
  x: number
  y: number
  w: number
  h: number
  /** トラックパッドモードで使うキーの枠線意匠 */
  trackpad?: boolean
}

/** 対応 OS。OS 切替モードで Q/W/E/R に割り当て */
export type OsId = 'win' | 'mac' | 'android' | 'ios'

export const OS_LABELS: Record<OsId, string> = {
  win: 'Win/Linux',
  mac: 'Mac',
  android: 'Android',
  ios: 'iOS',
}

/**
 * レイヤーの有効化条件
 * - always:    常に有効（ベースレイヤー）
 * - os:        指定 OS が選ばれているとき有効（Apple 系の修飾キー差し替え等）
 * - os_select: OS 切替待機モード中だけ有効（このレイヤーだけで解決し、下には透過しない）
 */
export type LayerActivation = { type: 'always' } | { type: 'os'; os: OsId[] } | { type: 'os_select' }

export interface Layer {
  name: string
  activation: LayerActivation
  bindings: KeyBinding[]
}

export type BindingSlots = Partial<Record<Direction, string>>

/**
 * 1キー分のバインディング。省略した方向は下位レイヤーに透過（&trans と同じ）、
 * ベースレイヤーで省略した方向は &none
 */
export interface KeyBinding extends BindingSlots {
  /** グライド入力にする方向（それ以外はフリック） */
  glide?: Direction[]
  /** キートップ表示の上書き（省略時はバインディングから自動生成） */
  legend?: BindingSlots
}
