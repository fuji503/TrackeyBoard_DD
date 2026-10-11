import type { CSSProperties } from 'react'
import type { Direction } from '../../features/gesture/types'
import type { KeyView } from '../../features/keymap/view'
import KeyCap from '../KeyCap'

interface Props {
  views: KeyView[]
  cols: number
  rows: number
  pitchPx: number
  selected: number | null
  selectedDir: Direction
  /** 重なっているキー（赤く表示） */
  overlapping: Set<number>
  /** VTP の位置（単位: キーピッチ） */
  vtp?: { x: number; y: number }
  onSelect: (index: number) => void
}

/** エディタ用キーボード。タップでキーを選択する（入力はしない） */
export default function EditorKeyboard({ views, cols, rows, pitchPx, selected, selectedDir, overlapping, vtp, onSelect }: Props) {
  return (
    <div
      className="relative box-content shrink-0 border-t-2 border-l-2 border-slate-400 select-none"
      style={{ '--pitch': `${pitchPx}px`, width: cols * pitchPx, height: rows * pitchPx } as CSSProperties}
    >
      {views.map((view) => (
        <KeyCap
          key={view.index}
          view={view}
          selected={view.index === selected}
          highlight={view.index === selected ? selectedDir : null}
          background={overlapping.has(view.index) ? 'bg-red-100/80' : 'bg-white'}
          className="cursor-pointer hover:brightness-95"
          data-key-index={view.index}
          onPointerDown={(e) => {
            e.preventDefault()
            onSelect(view.index)
          }}
        />
      ))}
      {vtp && (
        <div
          className="pointer-events-none absolute z-20 rounded-full bg-red-500 ring-2 ring-white"
          style={{ left: vtp.x * pitchPx - pitchPx * 0.08, top: vtp.y * pitchPx - pitchPx * 0.08, width: pitchPx * 0.16, height: pitchPx * 0.16 }}
          title="バーチャルトラックポイント"
        />
      )}
    </div>
  )
}
