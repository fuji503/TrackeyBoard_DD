import { useRef } from 'react'
import { LAYOUT_COLS, LAYOUT_ROWS, type KeyDef } from '../data/layoutV35'
import type { GestureConfig, GestureEvent } from '../features/gesture/types'
import { usePreventTouchDefaults } from '../hooks/usePreventTouchDefaults'
import KeyButton from './KeyButton'

interface Props {
  keys: KeyDef[]
  config: GestureConfig
  onGesture: (key: KeyDef, event: GestureEvent) => void
}

export default function Keyboard({ keys, config, onGesture }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  usePreventTouchDefaults(ref)

  return (
    // @container: キー内の文字サイズを cqw（キーボード幅基準）で指定するため
    <div ref={ref} className="@container w-full touch-none select-none [-webkit-touch-callout:none]">
      <div
        className="grid border-t-2 border-l-2 border-slate-400"
        style={{
          gridTemplateColumns: `repeat(${LAYOUT_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${LAYOUT_ROWS}, 1fr)`,
          aspectRatio: `${LAYOUT_COLS} / ${LAYOUT_ROWS}`,
        }}
      >
        {keys.map((key) => (
          <KeyButton key={key.id} keyDef={key} config={config} onGesture={onGesture} />
        ))}
      </div>
    </div>
  )
}
