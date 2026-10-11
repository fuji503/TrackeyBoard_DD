import { useLayoutEffect, useRef } from 'react'
import type { Direction } from '../features/gesture/types'
import type { HidLogItem } from '../features/keymap/engine'

export interface LogEntry extends HidLogItem {
  id: number
  time: string
  direction: Direction
  /** 操作したキーの印字（中央） */
  keyLegend: string
}

const DIR_MARK: Record<Direction, string> = { center: '', up: '↑', down: '↓', left: '←', right: '→' }

const ACTION_STYLE: Record<HidLogItem['action'], string> = {
  tap: 'bg-sky-100 text-sky-800',
  glide: 'bg-emerald-100 text-emerald-800',
  hold: 'bg-amber-100 text-amber-800',
  release: 'bg-slate-100 text-slate-600',
  mode: 'bg-violet-100 text-violet-800',
}

function actionLabel(e: LogEntry): string {
  if (e.action === 'tap' && e.direction !== 'center') return `flick${DIR_MARK[e.direction]}`
  if (e.action === 'mode') return 'mode'
  return `${e.action}${DIR_MARK[e.direction]}`
}

/** 表示用に制御文字を記号化する */
function showChar(c: string): string {
  return c === ' ' ? '□' : c
}

/** HID キーコード履歴。新しいものを下に追加し、常に最新が見えるよう末尾へスクロールする */
export default function HistoryLog({ entries }: { entries: LogEntry[] }) {
  const ref = useRef<HTMLUListElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  return (
    <ul ref={ref} className="h-full overflow-y-auto p-1 font-mono text-xs">
      {entries.map((e) => (
        <li key={e.id} className="flex items-center gap-2 px-1 py-0.5 whitespace-nowrap" title={e.binding}>
          <span className="text-slate-400">{e.time}</span>
          <span className={`w-16 shrink-0 rounded px-1 text-center ${ACTION_STYLE[e.action]}`}>{actionLabel(e)}</span>
          <span className="w-12 shrink-0 truncate text-slate-500">{e.keyLegend}</span>
          {e.hid && <span className="font-bold text-slate-800">{e.hid}</span>}
          {e.usage && <span className="text-slate-400">{e.usage}</span>}
          {e.char !== undefined && <span className="text-blue-700">{showChar(e.char)}</span>}
          {e.note && <span className="truncate text-slate-500">{e.note}</span>}
        </li>
      ))}
    </ul>
  )
}
