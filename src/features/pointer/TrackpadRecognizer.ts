import { classify } from '../gesture/GestureRecognizer'
import type { MouseButton } from '../keymap/binding'
import type { PointerConfig } from './config'
import type { PointerOutput } from './output'

/**
 * タッチの種類（触り始めた位置のキーで決まる）
 * - surface: パッド面（カーソル移動・タップ・2本指操作）
 * - button:  マウスボタンのキー（Space）
 * - toggle:  Tab（下フリックでキーボードモードへ戻る。他の方向に動いたらパッド面扱い）
 */
export type PadTouchKind = { kind: 'surface' } | { kind: 'button'; button: MouseButton } | { kind: 'toggle' }

interface Touch {
  kind: 'surface' | 'button' | 'toggle' | 'consumed'
  button?: MouseButton
  startX: number
  startY: number
  x: number
  y: number
  startT: number
  lastT: number
}

/** パッド面に指が触れてから全て離れるまで（タップ判定の単位） */
interface Session {
  startT: number
  maxFingers: number
  moved: boolean
  scrolled: boolean
}

export interface TrackpadOptions {
  config: PointerConfig
  /** 画面上の 1px が実機の何 mm か */
  mmPerPx: number
  /** Tab の下フリックと判定する距離 (px) */
  toggleThresholdPx: number
  emit: (out: PointerOutput) => void
}

/**
 * トラックパッドモードのマルチタッチ認識（DOM 非依存。時刻は引数で受け取る）
 * - 1本指で動かす → カーソル移動（速いほど加速）
 * - 1本指タップ → 左クリック / 2本指タップ → 右クリック
 * - 2本指で動かす → スクロール
 * - Space（ボタン）を押したまま別の指で動かす → ドラッグ（ボタン押下 + 移動）
 * ダブルタップドラッグや長押しドラッグは仕様で無し
 */
export class TrackpadRecognizer {
  private readonly opts: TrackpadOptions
  private readonly touches = new Map<number, Touch>()
  private session: Session | null = null

  constructor(opts: TrackpadOptions) {
    this.opts = opts
  }

  down(id: number, x: number, y: number, t: number, kind: PadTouchKind): void {
    const touch: Touch = { kind: kind.kind, startX: x, startY: y, x, y, startT: t, lastT: t }
    if (kind.kind === 'button') {
      touch.button = kind.button
      this.opts.emit({ type: 'button', button: kind.button, pressed: true })
    }
    this.touches.set(id, touch)
    if (kind.kind === 'surface') this.joinSession(t)
  }

  move(id: number, x: number, y: number, t: number): void {
    const touch = this.touches.get(id)
    if (!touch) return
    const dxPx = x - touch.x
    const dyPx = y - touch.y
    const dt = Math.max(1, t - touch.lastT)
    touch.x = x
    touch.y = y
    touch.lastT = t

    if (touch.kind === 'toggle') {
      const dir = classify(x - touch.startX, y - touch.startY, this.opts.toggleThresholdPx)
      if (dir === 'down') {
        touch.kind = 'consumed'
        this.opts.emit({ type: 'exitTrackpad' })
      } else if (dir !== 'center') {
        // 下以外に動いたらパッド面として扱う（判定までの移動はカーソルに反映しない）
        touch.kind = 'surface'
        this.joinSession(touch.startT)
      }
      return
    }
    if (touch.kind !== 'surface' || !this.session) return

    const { config, mmPerPx, emit } = this.opts
    const distMm = Math.hypot(x - touch.startX, y - touch.startY) * mmPerPx
    if (distMm > config.tapSlopMm) this.session.moved = true

    const fingers = this.surfaceCount()
    if (fingers === 1) {
      // 指の速さ (mm/s) に応じて加速
      const speedMmS = (Math.hypot(dxPx, dyPx) * mmPerPx * 1000) / dt
      const gain = config.padSpeed * (1 + config.padAccel * Math.min(speedMmS / 100, 3))
      emit({ type: 'move', dx: dxPx * mmPerPx * gain, dy: dyPx * mmPerPx * gain })
    } else if (fingers >= 2) {
      // 各指の移動の平均をスクロール量にする
      const sign = config.naturalScroll ? -1 : 1
      const perStep = config.scrollStep * fingers
      emit({ type: 'scroll', dx: (sign * dxPx * mmPerPx) / perStep, dy: (sign * dyPx * mmPerPx) / perStep })
      this.session.scrolled = true
    }
  }

  up(id: number, t: number): void {
    const touch = this.touches.get(id)
    if (!touch) return
    this.touches.delete(id)
    const { emit, config } = this.opts

    switch (touch.kind) {
      case 'button':
        emit({ type: 'button', button: touch.button!, pressed: false })
        return
      case 'toggle':
        // 動かさずに離した Tab はパッド面のタップと同じ
        if (t - touch.startT <= config.tapMaxMs && this.surfaceCount() === 0) emit({ type: 'click', button: 'left' })
        emit({ type: 'strokeEnd' })
        return
      case 'consumed':
        return
    }

    if (this.surfaceCount() > 0 || !this.session) return
    const s = this.session
    this.session = null
    if (!s.moved && !s.scrolled && t - s.startT <= config.tapMaxMs) {
      emit({ type: 'click', button: s.maxFingers >= 2 ? 'right' : 'left' })
    }
    emit({ type: 'strokeEnd' })
  }

  /** 指が奪われた等。クリックは出さず、押下中のボタンは離す */
  cancel(id: number): void {
    const touch = this.touches.get(id)
    if (!touch) return
    this.touches.delete(id)
    if (touch.kind === 'button') this.opts.emit({ type: 'button', button: touch.button!, pressed: false })
    if (touch.kind === 'surface' && this.surfaceCount() === 0 && this.session) {
      this.session = null
      this.opts.emit({ type: 'strokeEnd' })
    }
  }

  /** 全ての指を解除する（モード切替時） */
  cancelAll(): void {
    for (const id of [...this.touches.keys()]) this.cancel(id)
  }

  private joinSession(t: number): void {
    if (!this.session) this.session = { startT: t, maxFingers: 0, moved: false, scrolled: false }
    this.session.maxFingers = Math.max(this.session.maxFingers, this.surfaceCount())
  }

  private surfaceCount(): number {
    let n = 0
    for (const t of this.touches.values()) if (t.kind === 'surface') n++
    return n
  }
}
