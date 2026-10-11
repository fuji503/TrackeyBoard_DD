import { useLayoutEffect, useRef } from 'react'
import type { Direction, GestureKind } from '../features/gesture/types'

export interface LogEntry {
  id: number
  time: string
  kind: GestureKind
  keyLabel: string
  direction: Direction
  output: string
}

const DIR_MARK: Record<Direction, string> = { center: '・', up: '↑', down: '↓', left: '←', right: '→' }

const KIND_STYLE: Record<GestureKind, string> = {
  tap: 'bg-sky-100 text-sky-800',
  holdStart: 'bg-amber-100 text-amber-800',
  holdRepeat: 'bg-amber-50 text-amber-700',
  holdEnd: 'bg-slate-100 text-slate-600',
  glide: 'bg-emerald-100 text-emerald-800',
}

/** 入力履歴。新しいものを下に追加し、常に最新が見えるよう末尾へスクロールする */
export default function HistoryLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLUListElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  return (
    <ul ref={ref} className="h-full overflow-y-auto p-1 font-mono text-xs">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center gap-2 px-1 py-0.5">
          <span className="text-slate-400">{e.time}</span>
          <span className={`w-20 rounded px-1 text-center ${KIND_STYLE[e.kind]}`}>{e.kind}</span>
          <span className="w-14 truncate font-bold">{e.keyLabel}</span>
          <span className="w-4 text-center">{DIR_MARK[e.direction]}</span>
          <span className="truncate text-blue-700">{e.output || '—'}</span>
        </li>
      ))}
    </ul>
  )
}
