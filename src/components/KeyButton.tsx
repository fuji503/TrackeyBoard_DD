import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { GestureRecognizer } from '../features/gesture/GestureRecognizer'
import {
  IDLE_STATE,
  SLIDE_DIRECTIONS,
  type Direction,
  type GestureConfig,
  type GestureEvent,
  type GestureState,
} from '../features/gesture/types'
import type { KeyView } from '../features/keymap/view'

interface Props {
  view: KeyView
  config: GestureConfig
  onGesture: (keyIndex: number, event: GestureEvent) => void
}

// 位置・文字サイズはキーピッチ (--pitch) 基準なので、拡大縮小に追従する
const LABEL_POS: Record<Exclude<Direction, 'center'>, string> = {
  up: 'top-[calc(var(--pitch)*0.03)] left-1/2 -translate-x-1/2',
  down: 'bottom-[calc(var(--pitch)*0.03)] left-1/2 -translate-x-1/2',
  left: 'left-[calc(var(--pitch)*0.045)] top-1/2 -translate-y-1/2',
  right: 'right-[calc(var(--pitch)*0.045)] top-1/2 -translate-y-1/2',
}

export default function KeyButton({ view, config, onGesture }: Props) {
  const [state, setState] = useState<GestureState>(IDLE_STATE)
  const recognizers = useRef(new Map<number, GestureRecognizer>())
  // 認識器はタッチ開始時に作られるので、最新のコールバックを参照できるよう ref 経由で呼ぶ
  const onGestureRef = useRef(onGesture)
  useLayoutEffect(() => {
    onGestureRef.current = onGesture
  })

  useEffect(() => {
    const map = recognizers.current
    return () => {
      map.forEach((r) => r.cancel())
      map.clear()
    }
  }, [])

  const handleDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    // 距離の基準は 1u（縦長の Ent キー等でも同じ感覚になるよう短辺を使う）
    const rect = e.currentTarget.getBoundingClientRect()
    const r = new GestureRecognizer({
      keySize: Math.min(rect.width / view.rect.w, rect.height / view.rect.h),
      glideDirections: view.glide,
      config,
      onEvent: (ev) => onGestureRef.current(view.index, ev),
      onStateChange: setState,
    })
    recognizers.current.set(e.pointerId, r)
    r.down(e.clientX, e.clientY)
  }

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    recognizers.current.get(e.pointerId)?.move(e.clientX, e.clientY)
  }

  const finish = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const r = recognizers.current.get(e.pointerId)
    if (!r) return
    recognizers.current.delete(e.pointerId)
    if (cancelled) r.cancel()
    else r.up()
  }

  const { rect, legends } = view
  const active = state.phase !== 'idle'
  const activeBg = state.holding ? 'bg-amber-200' : state.phase === 'glide' ? 'bg-emerald-200' : 'bg-sky-200'
  const highlight = (dir: Direction) =>
    active && state.direction === dir ? 'rounded bg-blue-600 px-[calc(var(--pitch)*0.02)] text-white' : ''

  return (
    <div
      className={`absolute select-none border-r-2 border-b-2 border-slate-400 ${active ? activeBg : 'bg-white'}`}
      style={{
        left: `calc(var(--pitch) * ${rect.x})`,
        top: `calc(var(--pitch) * ${rect.y})`,
        width: `calc(var(--pitch) * ${rect.w})`,
        height: `calc(var(--pitch) * ${rect.h})`,
      }}
      data-key-index={view.index}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
      onLostPointerCapture={(e) => finish(e, true)}
    >
      {view.trackpad && (
        <div className="pointer-events-none absolute inset-[calc(var(--pitch)*0.04)] border border-dashed border-slate-400" />
      )}
      <div
        className={`absolute inset-0 flex items-center justify-center text-center font-extrabold leading-none text-slate-700 ${
          [...(legends.center ?? '')].length > 1 ? 'text-[calc(var(--pitch)*0.155)]' : 'text-[calc(var(--pitch)*0.24)]'
        }`}
      >
        <span className={highlight('center')}>{legends.center}</span>
      </div>
      {SLIDE_DIRECTIONS.map((dir) => {
        const label = legends[dir]
        if (!label) return null
        return (
          <span
            key={dir}
            className={`absolute whitespace-nowrap text-[calc(var(--pitch)*0.115)] font-bold text-blue-600 ${LABEL_POS[dir as Exclude<Direction, 'center'>]} ${highlight(dir)}`}
          >
            {label}
          </span>
        )
      })}
      {view.subLegend && (
        <span className="absolute right-[calc(var(--pitch)*0.045)] bottom-[calc(var(--pitch)*0.03)] text-[calc(var(--pitch)*0.1)] font-bold text-red-600">
          [{view.subLegend}]
        </span>
      )}
    </div>
  )
}
