import type { Direction, GestureConfig, GestureEvent, GesturePhase, GestureState } from './types'

interface Point {
  x: number
  y: number
}

export interface GestureRecognizerOptions {
  /** キー幅 (px)。距離系パラメータの基準 */
  keySize: number
  /** グライド入力として扱う方向（それ以外の方向はフリック） */
  glideDirections: readonly Direction[]
  config: GestureConfig
  onEvent: (event: GestureEvent) => void
  onStateChange?: (state: GestureState) => void
}

/**
 * 1本の指（ポインタ）に対するジェスチャー認識器。
 * DOM に依存しないので、座標を与えればテストできる。
 *
 * 仕様（TrackeyBoard BM 要件定義 3.1）:
 * - タップ: 動かさずに離す → center の tap
 * - フリック: しきい値以上スライドして離す → その方向の tap（離した時点の方向で確定）
 * - ホールド: 指が停止してから holdDelay 経過で holdStart、以降 holdRepeat。フリック先でも可
 * - グライド: グライド方向にスライドすると glideStep ごとに glide。停止すればホールドに移行し、
 *   再び動かすとホールドを終えてグライドを再開する
 */
export class GestureRecognizer {
  private readonly opts: GestureRecognizerOptions
  private origin: Point = { x: 0, y: 0 }
  /** 停止判定の基準点。ここから stopTolerance 以上動くとホールド待ちをやり直す */
  private rest: Point = { x: 0, y: 0 }
  /** グライドで次の入力を発火させる基準点 */
  private glideAnchor: Point = { x: 0, y: 0 }
  private phase: GesturePhase = 'idle'
  private direction: Direction = 'center'
  private holding = false
  private holdTimer: ReturnType<typeof setTimeout> | undefined
  private repeatTimer: ReturnType<typeof setInterval> | undefined

  constructor(opts: GestureRecognizerOptions) {
    this.opts = opts
  }

  get state(): GestureState {
    return { phase: this.phase, direction: this.direction, holding: this.holding }
  }

  down(x: number, y: number): void {
    this.origin = { x, y }
    this.rest = { x, y }
    this.phase = 'touch'
    this.direction = 'center'
    this.holding = false
    this.armHold()
    this.notify()
  }

  move(x: number, y: number): void {
    if (this.phase === 'idle') return
    const { keySize, config } = this.opts

    const moved = dist({ x, y }, this.rest) > config.stopTolerance * keySize
    if (moved) {
      this.rest = { x, y }
      if (this.holding && this.phase === 'glide') {
        // グライド中のホールドは、指が動き出したら終了してグライドに戻る
        this.endHold()
        this.glideAnchor = { x, y }
      }
    }

    if (this.phase === 'glide') {
      this.stepGlide(x, y)
    } else if (!this.holding) {
      // ホールド確定後はフリック方向を固定する
      const dir = classify(x - this.origin.x, y - this.origin.y, config.flickThreshold * keySize)
      if (dir !== 'center' && this.isGlide(dir)) {
        this.phase = 'glide'
        this.direction = dir
        this.glideAnchor = { x, y }
        this.emit('glide', dir)
      } else {
        this.direction = dir
        this.phase = dir === 'center' ? 'touch' : 'flick'
      }
    }

    if (moved && !this.holding) this.armHold()
    this.notify()
  }

  up(): void {
    if (this.phase === 'idle') return
    this.clearTimers()
    if (this.holding) {
      this.endHold()
    } else if (this.phase !== 'glide') {
      this.emit('tap', this.direction)
    }
    this.reset()
  }

  /** ポインタが奪われた等。タップは発火させずに終了する */
  cancel(): void {
    if (this.phase === 'idle') return
    this.clearTimers()
    if (this.holding) this.endHold()
    this.reset()
  }

  private stepGlide(x: number, y: number): void {
    const step = this.opts.config.glideStep * this.opts.keySize
    for (;;) {
      const dx = x - this.glideAnchor.x
      const dy = y - this.glideAnchor.y
      const horizontal = Math.abs(dx) >= Math.abs(dy)
      const d = horizontal ? dx : dy
      if (Math.abs(d) < step) return
      const dir: Direction = horizontal ? (d > 0 ? 'right' : 'left') : d > 0 ? 'down' : 'up'
      // 主軸だけ step 進め、副軸のブレは捨てる（斜めの誤爆防止）
      if (horizontal) {
        this.glideAnchor = { x: this.glideAnchor.x + Math.sign(d) * step, y }
      } else {
        this.glideAnchor = { x, y: this.glideAnchor.y + Math.sign(d) * step }
      }
      if (this.isGlide(dir)) {
        this.direction = dir
        this.emit('glide', dir)
      }
    }
  }

  private armHold(): void {
    clearTimeout(this.holdTimer)
    this.holdTimer = setTimeout(() => this.startHold(), this.opts.config.holdDelay)
  }

  private startHold(): void {
    this.holding = true
    this.emit('holdStart', this.direction)
    this.repeatTimer = setInterval(
      () => this.emit('holdRepeat', this.direction),
      this.opts.config.repeatInterval,
    )
    this.notify()
  }

  private endHold(): void {
    clearInterval(this.repeatTimer)
    this.repeatTimer = undefined
    this.holding = false
    this.emit('holdEnd', this.direction)
  }

  private clearTimers(): void {
    clearTimeout(this.holdTimer)
    clearInterval(this.repeatTimer)
    this.holdTimer = undefined
    this.repeatTimer = undefined
  }

  private reset(): void {
    this.phase = 'idle'
    this.direction = 'center'
    this.holding = false
    this.notify()
  }

  private isGlide(dir: Direction): boolean {
    return this.opts.glideDirections.includes(dir)
  }

  private emit(kind: GestureEvent['kind'], direction: Direction): void {
    this.opts.onEvent({ kind, direction })
  }

  private notify(): void {
    this.opts.onStateChange?.(this.state)
  }
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** 移動量から方向を判定する。threshold 未満なら center */
export function classify(dx: number, dy: number, threshold: number): Direction {
  if (Math.hypot(dx, dy) < threshold) return 'center'
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}
