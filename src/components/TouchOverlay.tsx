import { useSyncExternalStore } from 'react'
import type { TouchMark, TouchStore } from '../features/pointer/touchStore'

const COLOR: Record<TouchMark['kind'], string> = {
  finger: 'border-orange-500 bg-orange-400/30',
  button: 'border-blue-500 bg-blue-400/30',
  stick: 'border-red-500 bg-red-400/30',
}

/** 触れている指を丸印で表示（トラックポイントは基準点からの矢印も） */
export default function TouchOverlay({ store, pitchPx }: { store: TouchStore; pitchPx: number }) {
  const marks = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const size = pitchPx * 0.45
  return (
    <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible">
      {marks.map((m, i) =>
        m.kind === 'stick' && m.originX !== undefined && m.originY !== undefined ? (
          <g key={i}>
            <line x1={m.originX} y1={m.originY} x2={m.x} y2={m.y} stroke="#ef4444" strokeWidth={3} />
            <circle cx={m.originX} cy={m.originY} r={4} fill="#ef4444" />
          </g>
        ) : null,
      )}
      {marks.map((m, i) => (
        <foreignObject key={`c${i}`} x={m.x - size / 2} y={m.y - size / 2} width={size} height={size}>
          <div className={`h-full w-full rounded-full border-2 ${COLOR[m.kind]}`} />
        </foreignObject>
      ))}
    </svg>
  )
}
