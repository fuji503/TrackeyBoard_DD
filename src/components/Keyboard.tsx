import { useMemo, useRef, type CSSProperties } from 'react'
import type { GestureConfig, GestureEvent } from '../features/gesture/types'
import { buildKeyViews, layoutBounds } from '../features/keymap/view'
import { usePreventTouchDefaults } from '../hooks/usePreventTouchDefaults'
import type { Keymap } from '../types/keymap'
import KeyButton from './KeyButton'

/** 外枠の上・左の線幅（各キーは右・下の線を持つ） */
export const KEYBOARD_BORDER_PX = 2

interface Props {
  keymap: Keymap
  config: GestureConfig
  /** キーピッチ (px) */
  pitchPx: number
  onGesture: (keyIndex: number, event: GestureEvent) => void
}

export default function Keyboard({ keymap, config, pitchPx, onGesture }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  usePreventTouchDefaults(ref)
  const views = useMemo(() => buildKeyViews(keymap), [keymap])
  const { cols, rows } = layoutBounds(keymap)

  return (
    <div
      ref={ref}
      className="relative box-content shrink-0 touch-none border-t-2 border-l-2 border-slate-400 select-none [-webkit-touch-callout:none]"
      style={
        {
          '--pitch': `${pitchPx}px`,
          width: cols * pitchPx,
          height: rows * pitchPx,
        } as CSSProperties
      }
    >
      {views.map((view) => (
        <KeyButton key={view.index} view={view} config={config} onGesture={onGesture} />
      ))}
    </div>
  )
}
