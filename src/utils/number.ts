/** 刻み幅の小数桁で丸める（0.1 + 0.2 のような誤差を消す） */
export function roundToStep(value: number, step: number): number {
  const decimals = (String(step).split('.')[1] ?? '').length
  return Number(value.toFixed(decimals))
}

/** 範囲内に収めて刻み幅で丸める */
export function clampToRange(value: number, min: number, max: number, step: number): number {
  return roundToStep(Math.min(max, Math.max(min, value)), step)
}
