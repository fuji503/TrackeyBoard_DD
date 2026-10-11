/**
 * トラックパッド / トラックポイントの設定。
 * 距離は実機 (BM) 上の mm（画面上の指の移動を、キーピッチ 17mm 換算で mm に直して使う）
 */

/** VTP をホールド判定前に離したとき: 下のキーを入力 / 何もしない */
export type VtpTapAction = 'key' | 'none'
/** VTP をホールド判定前に動かしたとき: 下のキーのフリック等 / 何もしない / すぐトラックポイント */
export type VtpMoveAction = 'key' | 'none' | 'trackpoint'

export interface PointerConfig {
  // ---- トラックパッド ----
  /** カーソル移動量 (px / mm) */
  padSpeed: number
  /** 加速の強さ（0 で加速なし） */
  padAccel: number
  /** 2本指スクロール: ホイール1段あたりの指の移動 (mm) */
  scrollStep: number
  /** ナチュラルスクロール（指と同じ向きに内容が動く）なら 1、逆なら 0 */
  naturalScroll: number
  /** タップ（クリック）とみなす最大時間 (ms) */
  tapMaxMs: number
  /** タップとみなす最大移動 (mm) */
  tapSlopMm: number

  // ---- トラックポイント (VTP) ----
  /** VTP の反応範囲（半径 mm） */
  vtpRadiusMm: number
  /** VTP をホールドしてトラックポイントモードに入るまでの時間 (ms) */
  vtpHoldMs: number
  /** ホールド判定前に「動かした」とみなす距離 (mm) */
  vtpSlopMm: number
  vtpTapAction: VtpTapAction
  vtpMoveAction: VtpMoveAction
  /** 不感帯（この距離までずらしても動かない, mm） */
  stickDeadzoneMm: number
  /** 最高速度に達するずらし量 (mm) */
  stickRangeMm: number
  /** 最高速度 (px/s) */
  stickMaxSpeed: number
  /** 感度カーブ（1 = 比例、大きいほど小さなずらしで遅く、大きなずらしで速い） */
  stickCurve: number
  /** 中ボタン + VTP のスクロール最高速度（ホイール段 / 秒） */
  stickScrollSpeed: number
}

export const DEFAULT_POINTER_CONFIG: PointerConfig = {
  padSpeed: 6,
  padAccel: 0.5,
  scrollStep: 3,
  naturalScroll: 1,
  tapMaxMs: 200,
  tapSlopMm: 1.5,
  vtpRadiusMm: 4,
  vtpHoldMs: 250,
  vtpSlopMm: 1.5,
  vtpTapAction: 'key',
  vtpMoveAction: 'key',
  stickDeadzoneMm: 0.5,
  stickRangeMm: 4,
  stickMaxSpeed: 800,
  stickCurve: 1.8,
  stickScrollSpeed: 20,
}

type NumericKey = { [K in keyof PointerConfig]: PointerConfig[K] extends number ? K : never }[keyof PointerConfig]

export const POINTER_RANGES: Record<NumericKey, { min: number; max: number; step: number }> = {
  padSpeed: { min: 1, max: 30, step: 0.5 },
  padAccel: { min: 0, max: 3, step: 0.1 },
  scrollStep: { min: 0.5, max: 10, step: 0.5 },
  naturalScroll: { min: 0, max: 1, step: 1 },
  tapMaxMs: { min: 50, max: 500, step: 10 },
  tapSlopMm: { min: 0.2, max: 5, step: 0.1 },
  vtpRadiusMm: { min: 1, max: 10, step: 0.5 },
  vtpHoldMs: { min: 50, max: 1000, step: 10 },
  vtpSlopMm: { min: 0.2, max: 5, step: 0.1 },
  stickDeadzoneMm: { min: 0, max: 3, step: 0.1 },
  stickRangeMm: { min: 1, max: 10, step: 0.5 },
  stickMaxSpeed: { min: 100, max: 3000, step: 50 },
  stickCurve: { min: 0.5, max: 4, step: 0.1 },
  stickScrollSpeed: { min: 2, max: 60, step: 1 },
}

export const VTP_TAP_ACTIONS: VtpTapAction[] = ['key', 'none']
export const VTP_MOVE_ACTIONS: VtpMoveAction[] = ['key', 'none', 'trackpoint']

/** 不完全・範囲外の設定値を既定値と範囲で補う */
export function normalizePointerConfig(partial: Record<string, unknown> = {}): PointerConfig {
  const result = { ...DEFAULT_POINTER_CONFIG }
  for (const key of Object.keys(POINTER_RANGES) as NumericKey[]) {
    const v = partial[key]
    if (typeof v === 'number' && Number.isFinite(v)) {
      const { min, max } = POINTER_RANGES[key]
      result[key] = Math.min(max, Math.max(min, v))
    }
  }
  if (VTP_TAP_ACTIONS.includes(partial.vtpTapAction as VtpTapAction)) result.vtpTapAction = partial.vtpTapAction as VtpTapAction
  if (VTP_MOVE_ACTIONS.includes(partial.vtpMoveAction as VtpMoveAction)) {
    result.vtpMoveAction = partial.vtpMoveAction as VtpMoveAction
  }
  return result
}

/**
 * トラックポイントの伝達関数: ずらし量 (mm) → カーソル速度 (px/s)
 * 不感帯まではゼロ、そこから stickRangeMm で最高速度に達する（カーブは指数）
 */
export function stickSpeed(displacementMm: number, cfg: PointerConfig): number {
  const { stickDeadzoneMm: dz, stickRangeMm: range, stickMaxSpeed: max, stickCurve: curve } = cfg
  if (displacementMm <= dz) return 0
  const t = Math.min(1, (displacementMm - dz) / Math.max(0.01, range - dz))
  return max * Math.pow(t, curve)
}
