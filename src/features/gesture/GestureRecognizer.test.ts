import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GestureRecognizer, classify } from './GestureRecognizer'
import { DEFAULT_GESTURE_CONFIG, type Direction, type GestureEvent } from './types'

// キー幅 100px → flickThreshold 30px, glideStep 30px, stopTolerance 8px
const KEY = 100
const { holdDelay, repeatInterval } = DEFAULT_GESTURE_CONFIG

function setup(glideDirections: Direction[] = []) {
  const events: GestureEvent[] = []
  const r = new GestureRecognizer({
    keySize: KEY,
    glideDirections,
    config: DEFAULT_GESTURE_CONFIG,
    onEvent: (e) => events.push(e),
  })
  const kinds = () => events.map((e) => `${e.kind}:${e.direction}`)
  return { r, events, kinds }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('classify', () => {
  it('しきい値未満は center', () => {
    expect(classify(10, 10, 30)).toBe('center')
  })
  it('主軸で方向を決める', () => {
    expect(classify(40, 10, 30)).toBe('right')
    expect(classify(-40, 10, 30)).toBe('left')
    expect(classify(10, 40, 30)).toBe('down')
    expect(classify(10, -40, 30)).toBe('up')
  })
})

describe('タップ / フリック', () => {
  it('動かさずに離すと center の tap', () => {
    const { r, kinds } = setup()
    r.down(0, 0)
    r.move(3, 2)
    r.up()
    expect(kinds()).toEqual(['tap:center'])
  })

  it('しきい値を超えて離すとその方向の tap', () => {
    const { r, kinds } = setup()
    r.down(0, 0)
    r.move(0, -50)
    r.up()
    expect(kinds()).toEqual(['tap:up'])
  })

  it('方向は離した時点で確定する（途中で変えられる）', () => {
    const { r, kinds } = setup()
    r.down(0, 0)
    r.move(50, 0)
    r.move(0, 50)
    r.up()
    expect(kinds()).toEqual(['tap:down'])
  })

  it('一旦スライドしても中央に戻せば center', () => {
    const { r, kinds } = setup()
    r.down(0, 0)
    r.move(50, 0)
    r.move(5, 0)
    r.up()
    expect(kinds()).toEqual(['tap:center'])
  })
})

describe('ホールド', () => {
  it('停止したまま holdDelay で holdStart、以降 repeat、離して holdEnd（tap は出ない）', () => {
    const { r, kinds } = setup()
    r.down(0, 0)
    vi.advanceTimersByTime(holdDelay)
    vi.advanceTimersByTime(repeatInterval * 2)
    r.up()
    expect(kinds()).toEqual([
      'holdStart:center',
      'holdRepeat:center',
      'holdRepeat:center',
      'holdEnd:center',
    ])
  })

  it('holdDelay 前に離せばタップ', () => {
    const { r, kinds } = setup()
    r.down(0, 0)
    vi.advanceTimersByTime(holdDelay - 1)
    r.up()
    expect(kinds()).toEqual(['tap:center'])
  })

  it('フリック先で停止するとその方向のホールド（停止した瞬間から待ち受け）', () => {
    const { r, kinds } = setup()
    r.down(0, 0)
    vi.advanceTimersByTime(holdDelay - 100)
    r.move(-50, 0) // 動いたのでホールド待ちはやり直し
    vi.advanceTimersByTime(holdDelay - 1)
    expect(kinds()).toEqual([])
    vi.advanceTimersByTime(1)
    r.up()
    expect(kinds()).toEqual(['holdStart:left', 'holdEnd:left'])
  })

  it('ホールド確定後は方向が変わらない', () => {
    const { r, kinds } = setup()
    r.down(0, 0)
    r.move(50, 0)
    vi.advanceTimersByTime(holdDelay)
    r.move(0, 50)
    r.up()
    expect(kinds()).toEqual(['holdStart:right', 'holdEnd:right'])
  })

  it('cancel ではタップしない', () => {
    const { r, kinds } = setup()
    r.down(0, 0)
    r.cancel()
    expect(kinds()).toEqual([])
  })
})

describe('グライド', () => {
  it('グライド方向に入った瞬間に1回、以降 glideStep ごとに発火し、離しても tap は出ない', () => {
    const { r, kinds } = setup(['left', 'right', 'up', 'down'])
    r.down(0, 0)
    r.move(-30, 0) // しきい値到達 → 1回
    r.move(-60, 0) // +1 step
    r.move(-95, 0) // +1 step (端数 5px は持ち越し)
    r.move(-100, 0) // 合計 70px → まだ
    r.up()
    expect(kinds()).toEqual(['glide:left', 'glide:left', 'glide:left'])
  })

  it('1回の move で複数ステップ進めば複数回発火', () => {
    const { r, kinds } = setup(['right'])
    r.down(0, 0)
    r.move(30, 0)
    r.move(120, 0)
    expect(kinds()).toEqual(['glide:right', 'glide:right', 'glide:right', 'glide:right'])
  })

  it('折り返すと逆方向に発火する', () => {
    const { r, kinds } = setup(['left', 'right'])
    r.down(0, 0)
    r.move(-30, 0)
    r.move(0, 0)
    expect(kinds()).toEqual(['glide:left', 'glide:right'])
  })

  it('グライド中、グライドでない方向には発火しない', () => {
    const { r, kinds } = setup(['left'])
    r.down(0, 0)
    r.move(-30, 0)
    r.move(-30, -60)
    expect(kinds()).toEqual(['glide:left'])
  })

  it('フリック方向に先に入ればフリック扱い（方向ごとに排他）', () => {
    const { r, kinds } = setup(['left'])
    r.down(0, 0)
    r.move(0, -50)
    r.up()
    expect(kinds()).toEqual(['tap:up'])
  })

  it('グライド中に停止するとホールド、動き出すとホールド終了してグライド再開', () => {
    const { r, kinds } = setup(['left', 'right'])
    r.down(0, 0)
    r.move(-30, 0)
    vi.advanceTimersByTime(holdDelay + repeatInterval)
    r.move(-45, 0) // 動き出し → holdEnd（ここから新たにステップを数える）
    r.move(-75, 0) // +1 step
    r.up()
    expect(kinds()).toEqual([
      'glide:left',
      'holdStart:left',
      'holdRepeat:left',
      'holdEnd:left',
      'glide:left',
    ])
  })
})
