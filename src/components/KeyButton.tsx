import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import type { KeyDef } from '../data/layoutV35'
import { GestureRecognizer } from '../features/gesture/GestureRecognizer'
import {
  IDLE_STATE,
  SLIDE_DIRECTIONS,
  type Direction,
  type GestureConfig,
  type GestureEvent,
  type GestureState,
} from '../features/gesture/types'

interface Props {
  keyDef: KeyDef
  config: GestureConfig
  onGesture: (key: KeyDef, event: GestureEvent) => void
}

// フォントサイズはキーボード幅 (cqw) 基準なので、拡大縮小に追従する
const LABEL_POS: Record<Exclude<Direction, 'center'>, string> = {
  up: 'top-[0.3cqw] left-1/2 -translate-x-1/2',
  down: 'bottom-[0.3cqw] left-1/2 -translate-x-1/2',
  left: 'left-[0.4cqw] top-1/2 -translate-y-1/2',
  right: 'right-[0.4cqw] top-1/2 -translate-y-1/2',
}

export default function KeyButton({ keyDef, config, onGesture }: Props) {
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
    const r = new GestureRecognizer({
      keySize: e.currentTarget.getBoundingClientRect().width,
      glideDirections: keyDef.glide ?? [],
      config,
      onEvent: (ev) => onGestureRef.current(keyDef, ev),
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

  const active = state.phase !== 'idle'
  const activeBg = state.holding ? 'bg-amber-200' : state.phase === 'glide' ? 'bg-emerald-200' : 'bg-sky-200'
  const highlight = (dir: Direction) =>
    active && state.direction === dir ? 'rounded bg-blue-600 px-[0.2cqw] text-white' : ''

  return (
    <div
      className={`relative select-none border-r-2 border-b-2 border-slate-400 ${active ? activeBg : 'bg-white'}`}
      style={{
        gridRow: `${keyDef.row + 1} / span ${keyDef.rowSpan ?? 1}`,
        gridColumn: keyDef.col + 1,
      }}
      data-key-id={keyDef.id}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
      onLostPointerCapture={(e) => finish(e, true)}
    >
      {keyDef.trackpad && (
        <div className="pointer-events-none absolute inset-[0.35cqw] border border-dashed border-slate-400" />
      )}
      <div
        className={`absolute inset-0 flex items-center justify-center text-center font-extrabold leading-none text-slate-700 ${
          [...(keyDef.labels.center ?? '')].length > 1 ? 'text-[1.4cqw]' : 'text-[2.2cqw]'
        }`}
      >
        <span className={highlight('center')}>{keyDef.labels.center}</span>
      </div>
      {SLIDE_DIRECTIONS.map((dir) => {
        const label = keyDef.labels[dir]
        if (!label) return null
        return (
          <span
            key={dir}
            className={`absolute whitespace-nowrap text-[1.05cqw] font-bold text-blue-600 ${LABEL_POS[dir as Exclude<Direction, 'center'>]} ${highlight(dir)}`}
          >
            {label}
          </span>
        )
      })}
      {keyDef.mac && (
        <span className="absolute right-[0.4cqw] bottom-[0.3cqw] text-[0.9cqw] font-bold text-red-600">
          [{keyDef.mac}]
        </span>
      )}
    </div>
  )
}
