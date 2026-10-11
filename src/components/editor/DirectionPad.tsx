import type { Direction } from '../../features/gesture/types'
import type { KeyView } from '../../features/keymap/view'

interface Props {
  view: KeyView
  selected: Direction
  /** グライドに設定されている方向 */
  glide: Direction[]
  onSelect: (dir: Direction) => void
}

const CELLS: { dir: Direction; area: string }[] = [
  { dir: 'up', area: 'col-start-2 row-start-1' },
  { dir: 'left', area: 'col-start-1 row-start-2' },
  { dir: 'center', area: 'col-start-2 row-start-2' },
  { dir: 'right', area: 'col-start-3 row-start-2' },
  { dir: 'down', area: 'col-start-2 row-start-3' },
]

const DIR_NAME: Record<Direction, string> = { center: 'タップ', up: '上', down: '下', left: '左', right: '右' }

/** 選択中キーの中央・上下左右（画面イメージの十字）。押した方向を編集対象にする */
export default function DirectionPad({ view, selected, glide, onSelect }: Props) {
  return (
    <div className="grid w-fit grid-cols-[repeat(3,4.5rem)] grid-rows-[repeat(3,4.5rem)] gap-1">
      {CELLS.map(({ dir, area }) => {
        const label = view.legends[dir]
        const inherited = view.inherited?.[dir]
        return (
          <button
            key={dir}
            type="button"
            aria-label={`${DIR_NAME[dir]}を編集`}
            aria-pressed={dir === selected}
            onClick={() => onSelect(dir)}
            className={`${area} relative flex flex-col items-center justify-center rounded border-2 bg-white px-1 ${
              dir === selected ? 'border-red-500 shadow' : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <span className="absolute top-0.5 left-1 text-[10px] text-slate-400">{DIR_NAME[dir]}</span>
            {glide.includes(dir) && (
              <span className="absolute top-0.5 right-1 rounded bg-emerald-100 px-0.5 text-[10px] text-emerald-700">
                グライド
              </span>
            )}
            <span
              className={`max-w-full truncate font-bold ${dir === 'center' ? 'text-lg text-slate-700' : 'text-sm text-blue-600'} ${
                inherited ? 'opacity-35' : ''
              }`}
            >
              {label ?? '—'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
