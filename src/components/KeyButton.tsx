import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { GestureRecognizer } from '../features/gesture/GestureRecognizer'
import {
  IDLE_STATE,
  type GestureConfig,
  type GestureEvent,
  type GestureState,
} from '../features/gesture/types'
import type { KeyView } from '../features/keymap/view'
import KeyCap from './KeyCap'

interface Props {
  view: KeyView
  config: GestureConfig
  onGesture: (keyIndex: number, event: GestureEvent) => void
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

  const active = state.phase !== 'idle'
  const background = !active
    ? 'bg-white'
    : state.holding
      ? 'bg-amber-200'
      : state.phase === 'glide'
        ? 'bg-emerald-200'
        : 'bg-sky-200'

  return (
    <KeyCap
      view={view}
      highlight={active ? state.direction : null}
      background={background}
      data-key-index={view.index}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
      onLostPointerCapture={(e) => finish(e, true)}
    />
  )
}
