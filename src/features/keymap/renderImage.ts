import type { Keymap } from '../../types/keymap'
import { buildKeyViews, layoutBounds } from './view'

const FONT = '"Segoe UI", "Hiragino Sans", Meiryo, system-ui, sans-serif'
const COLOR = { border: '#94a3b8', main: '#334155', flick: '#2563eb', sub: '#dc2626', title: '#0f172a' }

/**
 * キーマップを画面と同じ見た目で PNG に描画する（ベースレイヤーの印字 + OS 別の赤字）
 * @param pitch 1キーの大きさ (px, 等倍時)
 * @param scale 解像度の倍率
 */
export function renderKeymapPng(keymap: Keymap, pitch = 90, scale = 2): Promise<Blob> {
  const { cols, rows } = layoutBounds(keymap)
  const pad = 24
  const titleH = 36
  const canvas = document.createElement('canvas')
  canvas.width = (cols * pitch + pad * 2) * scale
  canvas.height = (rows * pitch + pad * 2 + titleH) * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.reject(new Error('Canvas が使えません'))
  ctx.scale(scale, scale)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = COLOR.title
  ctx.font = `bold 18px ${FONT}`
  ctx.textBaseline = 'top'
  ctx.fillText(keymap.name, pad, pad)

  const ox = pad
  const oy = pad + titleH
  const text = (s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign, weight = 700) => {
    ctx.font = `${weight} ${size}px ${FONT}`
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.textBaseline = 'middle'
    ctx.fillText(s, x, y)
  }

  for (const v of buildKeyViews(keymap)) {
    const x = ox + v.rect.x * pitch
    const y = oy + v.rect.y * pitch
    const w = v.rect.w * pitch
    const h = v.rect.h * pitch
    ctx.strokeStyle = COLOR.border
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.strokeRect(x, y, w, h)
    if (v.trackpad) {
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      const inset = pitch * 0.05
      ctx.strokeRect(x + inset, y + inset, w - inset * 2, h - inset * 2)
    }

    const cx = x + w / 2
    const cy = y + h / 2
    const small = pitch * 0.115
    const { center, up, down, left, right } = v.legends
    if (center) {
      const size = [...center].length > 1 ? pitch * 0.155 : pitch * 0.24
      text(center, cx, cy, size, COLOR.main, 'center', 800)
    }
    if (up) text(up, cx, y + small * 0.9, small, COLOR.flick, 'center')
    if (down) text(down, cx, y + h - small * 0.9, small, COLOR.flick, 'center')
    if (left) text(left, x + pitch * 0.05, cy, small, COLOR.flick, 'left')
    if (right) text(right, x + w - pitch * 0.05, cy, small, COLOR.flick, 'right')
    if (v.subLegend) text(`[${v.subLegend}]`, x + w - pitch * 0.05, y + h - pitch * 0.08, pitch * 0.1, COLOR.sub, 'right')
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('画像を作成できませんでした'))), 'image/png'),
  )
}
