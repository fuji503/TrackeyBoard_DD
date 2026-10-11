import { useRef } from 'react'
import { LAYOUT_COLS, LAYOUT_ROWS, type KeyDef } from '../data/layoutV35'
import type { GestureConfig, GestureEvent } from '../features/gesture/types'
import { usePreventTouchDefaults } from '../hooks/usePreventTouchDefaults'
import KeyButton from './KeyButton'

const BORDER_PX = 2

interface Props {
  keys: KeyDef[]
  config: GestureConfig
  /** キーピッチ (px) */
  pitchPx: number
  onGesture: (key: KeyDef, event: GestureEvent) => void
}

export default function Keyboard({ keys, config, pitchPx, onGesture }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  usePreventTouchDefaults(ref)

  return (
    // @container: キー内の文字サイズを cqw（キーボード幅基準）で指定するため
    <div
      ref={ref}
      className="@container shrink-0 touch-none select-none [-webkit-touch-callout:none]"
      // 左端の枠線 (2px) の分を足す
      style={{ width: LAYOUT_COLS * pitchPx + BORDER_PX }}
    >
      <div
        className="grid border-t-2 border-l-2 border-slate-400"
        style={{
          // 各キーは右・下の枠線込みで pitchPx 四方
          gridTemplateColumns: `repeat(${LAYOUT_COLS}, ${pitchPx}px)`,
          gridTemplateRows: `repeat(${LAYOUT_ROWS}, ${pitchPx}px)`,
        }}
      >
        {keys.map((key) => (
          <KeyButton key={key.id} keyDef={key} config={config} onGesture={onGesture} />
        ))}
      </div>
    </div>
  )
}
