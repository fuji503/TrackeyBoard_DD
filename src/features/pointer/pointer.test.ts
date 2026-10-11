import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_KEYMAP } from '../../data/keymaps'
import { INITIAL_ENGINE_STATE, handleGesture, setMode } from '../keymap/engine'
import { DEFAULT_POINTER_CONFIG, normalizePointerConfig, stickSpeed, type PointerConfig } from './config'
import { MouseLogAggregator } from './mouseLog'
import type { PointerOutput } from './output'
import { TrackpadRecognizer } from './TrackpadRecognizer'
import { VtpSession, type VtpEvent } from './VtpSession'

// 1px = 0.1mm とする（キーピッチ 170px 相当）
const MM_PER_PX = 0.1
const CFG: PointerConfig = { ...DEFAULT_POINTER_CONFIG, padAccel: 0, padSpeed: 10, naturalScroll: 1 }

function pad(config = CFG) {
  const out: PointerOutput[] = []
  const r = new TrackpadRecognizer({ config, mmPerPx: MM_PER_PX, toggleThresholdPx: 50, emit: (o) => out.push(o) })
  const types = () => out.map((o) => (o.type === 'click' ? `click:${o.button}` : o.type === 'button' ? `${o.button}:${o.pressed}` : o.type))
  return { r, out, types }
}

describe('TrackpadRecognizer', () => {
  it('1本指で動かすとカーソル移動（加速なしなら mm × 速度）、タップにはならない', () => {
    const { r, out, types } = pad()
    r.down(1, 0, 0, 0, { kind: 'surface' })
    r.move(1, 100, -50, 100) // 10mm, -5mm
    r.up(1, 150)
    expect(out[0]).toEqual({ type: 'move', dx: 100, dy: -50 })
    expect(types()).toEqual(['move', 'strokeEnd'])
  })

  it('加速: 速く動かすほど移動量が大きい', () => {
    const fast = pad({ ...CFG, padAccel: 1 })
    fast.r.down(1, 0, 0, 0, { kind: 'surface' })
    fast.r.move(1, 100, 0, 10) // 10mm を 10ms
    const slow = pad({ ...CFG, padAccel: 1 })
    slow.r.down(1, 0, 0, 0, { kind: 'surface' })
    slow.r.move(1, 100, 0, 1000)
    const dx = (o: PointerOutput) => (o.type === 'move' ? o.dx : 0)
    expect(dx(fast.out[0])).toBeGreaterThan(dx(slow.out[0]))
  })

  it('1本指タップで左クリック、2本指タップで右クリック', () => {
    const one = pad()
    one.r.down(1, 0, 0, 0, { kind: 'surface' })
    one.r.up(1, 100)
    expect(one.types()).toEqual(['click:left', 'strokeEnd'])

    const two = pad()
    two.r.down(1, 0, 0, 0, { kind: 'surface' })
    two.r.down(2, 300, 0, 20, { kind: 'surface' })
    two.r.up(1, 100)
    two.r.up(2, 110)
    expect(two.types()).toEqual(['click:right', 'strokeEnd'])
  })

  it('長く触れていたらタップにならない（長押しドラッグ等も無し）', () => {
    const { r, types } = pad()
    r.down(1, 0, 0, 0, { kind: 'surface' })
    r.up(1, CFG.tapMaxMs + 1)
    expect(types()).toEqual(['strokeEnd'])
  })

  it('2本指で動かすとスクロール（ナチュラル: 指を上へ → 下へスクロール）、クリックは出ない', () => {
    const { r, out, types } = pad()
    r.down(1, 0, 100, 0, { kind: 'surface' })
    r.down(2, 200, 100, 0, { kind: 'surface' })
    r.move(1, 0, 40, 50) // 指1 が 6mm 上へ
    r.up(1, 60)
    r.up(2, 70)
    const scroll = out.find((o) => o.type === 'scroll')
    // 平均移動 3mm / scrollStep 3mm = 1段
    expect(scroll).toMatchObject({ type: 'scroll', dy: 1 })
    expect(types()).not.toContain('click:right')
  })

  it('Space（ボタン）を押したまま別の指で動かすとドラッグ', () => {
    const { r, types } = pad()
    r.down(9, 0, 0, 0, { kind: 'button', button: 'left' })
    r.down(1, 0, 0, 10, { kind: 'surface' })
    r.move(1, 100, 0, 300)
    r.up(1, 400)
    r.up(9, 450)
    expect(types()).toEqual(['left:true', 'move', 'strokeEnd', 'left:false'])
  })

  it('Tab から下フリックでキーボードモードへ戻る（カーソルは動かない）', () => {
    const { r, types } = pad()
    r.down(1, 0, 0, 0, { kind: 'toggle' })
    r.move(1, 0, 60, 50)
    r.move(1, 0, 90, 80)
    r.up(1, 100)
    expect(types()).toEqual(['exitTrackpad'])
  })

  it('Tab から下以外に動かすとパッド面として扱う', () => {
    const { r, types } = pad()
    r.down(1, 0, 0, 0, { kind: 'toggle' })
    r.move(1, 60, 0, 50)
    r.move(1, 100, 0, 300)
    r.up(1, 400)
    expect(types()).toEqual(['move', 'strokeEnd'])
  })
})

describe('VtpSession', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  function session(config: Partial<PointerConfig> = {}) {
    const events: VtpEvent['type'][] = []
    const s = new VtpSession({
      config: { ...DEFAULT_POINTER_CONFIG, ...config },
      mmPerPx: MM_PER_PX,
      emit: (e) => events.push(e.type),
    })
    return { s, events }
  }

  it('動かさずに vtpHoldMs 保つとトラックポイント、離すと終了', () => {
    const { s, events } = session()
    s.down(0, 0)
    vi.advanceTimersByTime(DEFAULT_POINTER_CONFIG.vtpHoldMs)
    s.move(30, 0)
    expect(s.displacement()).toEqual({ x: 30, y: 0 })
    s.up()
    expect(events).toEqual(['enter', 'exit'])
  })

  it('判定前に離したとき: key なら下のキーをタップ、none なら何もしない', () => {
    const a = session({ vtpTapAction: 'key' })
    a.s.down(0, 0)
    a.s.up()
    expect(a.events).toEqual(['keyTap'])
    const b = session({ vtpTapAction: 'none' })
    b.s.down(0, 0)
    b.s.up()
    expect(b.events).toEqual([])
  })

  it('判定前に動かしたとき: key / none / trackpoint を切り替えられる', () => {
    const key = session({ vtpMoveAction: 'key' })
    key.s.down(0, 0)
    key.s.move(20, 0) // 2mm > slop 1.5mm
    expect(key.events).toEqual(['handOff'])

    const none = session({ vtpMoveAction: 'none' })
    none.s.down(0, 0)
    none.s.move(20, 0)
    vi.advanceTimersByTime(1000)
    none.s.up()
    expect(none.events).toEqual([])

    const tp = session({ vtpMoveAction: 'trackpoint' })
    tp.s.down(0, 0)
    tp.s.move(20, 0)
    expect(tp.events).toEqual(['enter'])
    expect(tp.s.displacement()).toEqual({ x: 20, y: 0 }) // 触り始めが基準
  })
})

describe('stickSpeed / config', () => {
  it('不感帯まではゼロ、範囲端で最高速度、その間はカーブ', () => {
    const cfg = { ...DEFAULT_POINTER_CONFIG, stickDeadzoneMm: 1, stickRangeMm: 3, stickMaxSpeed: 1000, stickCurve: 2 }
    expect(stickSpeed(0.5, cfg)).toBe(0)
    expect(stickSpeed(2, cfg)).toBeCloseTo(250)
    expect(stickSpeed(3, cfg)).toBe(1000)
    expect(stickSpeed(10, cfg)).toBe(1000)
  })

  it('設定の正規化: 範囲外は丸め、不正な選択肢は既定値', () => {
    const c = normalizePointerConfig({ padSpeed: 999, vtpMoveAction: 'bogus', vtpTapAction: 'none' })
    expect(c.padSpeed).toBe(30)
    expect(c.vtpMoveAction).toBe('key')
    expect(c.vtpTapAction).toBe('none')
  })
})

describe('MouseLogAggregator', () => {
  it('移動とスクロールはまとめて1件、ボタンは都度', () => {
    const agg = new MouseLogAggregator()
    expect(agg.add({ type: 'move', dx: 3.4, dy: -1 })).toEqual([])
    agg.add({ type: 'move', dx: 3.4, dy: -1 })
    const logs = agg.add({ type: 'click', button: 'left' })
    expect(logs.map((l) => `${l.hid} ${l.note ?? ''}`.trim())).toEqual(['MOUSE dx=+7 dy=-2', 'BTN1 クリック'])
    agg.add({ type: 'scroll', dx: 0, dy: 2 })
    expect(agg.add({ type: 'strokeEnd' })[0].hid).toBe('WHEEL v=-2 h=0')
  })
})

describe('engine のモード', () => {
  it('Tab 下フリック (&tp_toggle) でトラックパッドモードに切り替わる', () => {
    const r = handleGesture(INITIAL_ENGINE_STATE, DEFAULT_KEYMAP, 11, { kind: 'tap', direction: 'down' })
    expect(r.state.mode).toBe('trackpad')
    expect(r.logs[0].note).toBe('トラックパッドモード')
  })

  it('モードが変わると修飾キーのホールドは解除', () => {
    const held = { ...INITIAL_ENGINE_STATE, heldMods: { 22: 2 } }
    expect(setMode(held, 'trackpoint').state.heldMods).toEqual({})
  })
})
