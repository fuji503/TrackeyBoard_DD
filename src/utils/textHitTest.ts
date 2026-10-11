/**
 * テキスト表示内の座標から、文字カーソルを置く位置（文字番号）を求める。
 * 各文字は data-i 属性付きの span で描画されている前提
 */
export function caretOffsetAt(container: HTMLElement, clientX: number, clientY: number, textLength: number): number {
  const spans = container.querySelectorAll<HTMLElement>('[data-i]')
  let best: { i: number; len: number; rect: DOMRect; isNewline: boolean } | null = null
  let bestScore = Infinity
  for (const span of spans) {
    const rect = span.getBoundingClientRect()
    // 行（縦方向）の近さを優先し、同じ行の中で横方向の近さを比べる
    const dy = Math.max(rect.top - clientY, 0, clientY - rect.bottom)
    const dx = Math.max(rect.left - clientX, 0, clientX - rect.right)
    const score = dy * 10000 + dx
    if (score < bestScore) {
      bestScore = score
      best = { i: Number(span.dataset.i), len: span.dataset.nl === '1' ? 1 : [...(span.textContent ?? ' ')][0].length, rect, isNewline: span.dataset.nl === '1' }
    }
  }
  if (!best) return textLength
  // 改行文字は行末なので、その手前に置く。通常の文字は右半分ならその後ろ
  if (best.isNewline) return best.i
  return clientX > best.rect.left + best.rect.width / 2 ? best.i + best.len : best.i
}
