/** ジェスチャーの方向。center はタップ/ホールド（スライドなし） */
export type Direction = 'center' | 'up' | 'down' | 'left' | 'right'

export const SLIDE_DIRECTIONS: readonly Direction[] = ['up', 'down', 'left', 'right']

/**
 * 認識結果として通知されるイベント
 * - tap:        指を離した時点の方向の入力（フリック含む）
 * - holdStart:  指が停止したまま holdDelay 経過（押しっぱなし開始）
 * - holdRepeat: ホールド中の連続入力ティック（修飾キーでは無視される想定）
 * - holdEnd:    ホールド終了（指を離した / グライド再開）
 * - glide:      グライドでスライド距離が glideStep 進むごとに発火
 */
export type GestureKind = 'tap' | 'holdStart' | 'holdRepeat' | 'holdEnd' | 'glide'

export interface GestureEvent {
  kind: GestureKind
  direction: Direction
}

/**
 * 認識中の状態（描画用）
 * - touch: 触れているがしきい値を超えて動いていない
 * - flick: しきい値を超えてスライド中（離すとその方向のタップ）
 * - glide: グライド中
 */
export type GesturePhase = 'idle' | 'touch' | 'flick' | 'glide'

export interface GestureState {
  phase: GesturePhase
  direction: Direction
  holding: boolean
}

export const IDLE_STATE: GestureState = { phase: 'idle', direction: 'center', holding: false }

/** 距離系のパラメータはキー幅に対する比率 */
export interface GestureConfig {
  /** フリック/グライドと判定する移動距離 */
  flickThreshold: number
  /** グライドで1回入力するごとのスライド距離 */
  glideStep: number
  /** この距離以内の動きは「停止中」とみなす */
  stopTolerance: number
  /** 停止してからホールドと判定するまでの時間 (ms) */
  holdDelay: number
  /** ホールド中の連続入力間隔 (ms) */
  repeatInterval: number
}

export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  flickThreshold: 0.3,
  glideStep: 0.5,
  stopTolerance: 0.08,
  holdDelay: 400,
  repeatInterval: 80,
}

/** 各設定値の範囲と刻み（設定コンソールとインポート時の補正で共用） */
export const GESTURE_RANGES: Record<keyof GestureConfig, { min: number; max: number; step: number }> = {
  flickThreshold: { min: 0.1, max: 0.8, step: 0.05 },
  glideStep: { min: 0.1, max: 1, step: 0.05 },
  stopTolerance: { min: 0.01, max: 0.5, step: 0.01 },
  holdDelay: { min: 150, max: 1000, step: 10 },
  repeatInterval: { min: 30, max: 300, step: 5 },
}

/** 不完全・範囲外の設定値を既定値と範囲で補う */
export function normalizeGestureConfig(partial: Partial<Record<keyof GestureConfig, unknown>> = {}): GestureConfig {
  const result = { ...DEFAULT_GESTURE_CONFIG }
  for (const key of Object.keys(GESTURE_RANGES) as (keyof GestureConfig)[]) {
    const v = partial[key]
    if (typeof v === 'number' && Number.isFinite(v)) {
      const { min, max } = GESTURE_RANGES[key]
      result[key] = Math.min(max, Math.max(min, v))
    }
  }
  return result
}
