/** 実機 (TrackeyBoard BM) のキーピッチ */
export const BM_KEY_PITCH_MM = 17

/** CSS 仕様上の 1mm (96dpi 換算)。実際の端末では誤差があるため実測で補正する */
export const CSS_PX_PER_MM = 96 / 25.4

/**
 * キーボードの表示サイズ設定
 * - fit:    画面幅いっぱいに表示
 * - manual: pitchMm × pxPerMm (px) をキーピッチとして表示
 */
export interface KeyboardSize {
  mode: 'fit' | 'manual'
  pitchMm: number
  /** 端末ごとの px/mm。定規での実測補正で更新される */
  pxPerMm: number
}

export const DEFAULT_KEYBOARD_SIZE: KeyboardSize = {
  mode: 'fit',
  pitchMm: BM_KEY_PITCH_MM,
  pxPerMm: CSS_PX_PER_MM,
}

export const PITCH_RANGE_MM = { min: 8, max: 30, step: 0.1 }

/** fit 時の上限（大画面で巨大にならないように） */
const FIT_MAX_PITCH_PX = 100

/** 表示するキーピッチ (px) を求める */
export function resolvePitchPx(size: KeyboardSize, availableWidth: number, cols: number): number {
  if (size.mode === 'manual') return size.pitchMm * size.pxPerMm
  return Math.min(FIT_MAX_PITCH_PX, Math.max(0, availableWidth) / cols)
}

/**
 * 画面上のキー幅を定規で測った値から px/mm を補正し、実機のキーピッチで表示する設定を返す
 * @param currentPitchPx 測ったときに表示されていたキーピッチ (px)
 * @param measuredMm 定規で測ったキー幅 (mm)
 */
export function calibrate(currentPitchPx: number, measuredMm: number): KeyboardSize {
  return { mode: 'manual', pitchMm: BM_KEY_PITCH_MM, pxPerMm: currentPitchPx / measuredMm }
}
