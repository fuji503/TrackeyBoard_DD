import type { PointerConfig } from './config'

/**
 * VTP 上で触り始めた1本の指の扱いを決める（キーボードモード中）
 * - pending:  判定待ち（vtpHoldMs 動かさずに保つとトラックポイントへ）
 * - active:   トラックポイント操作中（origin からのずらし量でカーソル速度が決まる）
 * - handedOff: 下のキーの入力に引き渡した
 * - ignored:  何もしない（離すまで無視）
 */
export type VtpPhase = 'pending' | 'active' | 'handedOff' | 'ignored' | 'done'

export type VtpEvent =
  /** トラックポイントモード開始 */
  | { type: 'enter' }
  /** トラックポイントモード終了（指を離した） */
  | { type: 'exit' }
  /** 判定前に離した → 下のキーのタップとして入力 */
  | { type: 'keyTap' }
  /** 判定前に動かした → 下のキーのジェスチャーとして引き継ぐ */
  | { type: 'handOff' }

export interface VtpSessionOptions {
  config: PointerConfig
  /** 画面上の 1px が実機の何 mm か */
  mmPerPx: number
  emit: (e: VtpEvent) => void
}

interface Point {
  x: number
  y: number
}

export class VtpSession {
  private readonly opts: VtpSessionOptions
  phase: VtpPhase = 'pending'
  private start: Point = { x: 0, y: 0 }
  private current: Point = { x: 0, y: 0 }
  /** ずらし量の基準点（トラックポイント開始時の指の位置） */
  private origin: Point = { x: 0, y: 0 }
  private timer: ReturnType<typeof setTimeout> | undefined

  constructor(opts: VtpSessionOptions) {
    this.opts = opts
  }

  down(x: number, y: number): void {
    this.start = { x, y }
    this.current = { x, y }
    this.timer = setTimeout(() => {
      if (this.phase === 'pending') this.enter(this.current)
    }, this.opts.config.vtpHoldMs)
  }

  move(x: number, y: number): void {
    this.current = { x, y }
    if (this.phase !== 'pending') return
    const movedMm = Math.hypot(x - this.start.x, y - this.start.y) * this.opts.mmPerPx
    if (movedMm <= this.opts.config.vtpSlopMm) return
    clearTimeout(this.timer)
    switch (this.opts.config.vtpMoveAction) {
      case 'key':
        this.phase = 'handedOff'
        this.opts.emit({ type: 'handOff' })
        break
      case 'none':
        this.phase = 'ignored'
        break
      case 'trackpoint':
        // 触り始めた位置を基準にするので、動かした分がそのまま傾きになる
        this.enter(this.start)
        break
    }
  }

  up(): void {
    clearTimeout(this.timer)
    if (this.phase === 'pending' && this.opts.config.vtpTapAction === 'key') this.opts.emit({ type: 'keyTap' })
    if (this.phase === 'active') this.opts.emit({ type: 'exit' })
    this.phase = 'done'
  }

  cancel(): void {
    clearTimeout(this.timer)
    if (this.phase === 'active') this.opts.emit({ type: 'exit' })
    this.phase = 'done'
  }

  /** トラックポイント操作中のずらし量 (px)。操作中でなければ null */
  displacement(): Point | null {
    if (this.phase !== 'active') return null
    return { x: this.current.x - this.origin.x, y: this.current.y - this.origin.y }
  }

  get originPoint(): Point {
    return this.origin
  }

  private enter(origin: Point): void {
    this.phase = 'active'
    this.origin = origin
    this.opts.emit({ type: 'enter' })
  }
}
