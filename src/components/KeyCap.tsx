import type { HTMLAttributes } from 'react'
import { SLIDE_DIRECTIONS, type Direction } from '../features/gesture/types'
import type { KeyView } from '../features/keymap/view'

interface Props extends HTMLAttributes<HTMLDivElement> {
  view: KeyView
  /** 強調表示する方向（入力中の方向、エディタで選択中の方向） */
  highlight?: Direction | null
  /** 背景色クラス */
  background?: string
  /** エディタで選択中のキー */
  selected?: boolean
}

// 位置・文字サイズはキーピッチ (--pitch) 基準なので、拡大縮小に追従する
const LABEL_POS: Record<Exclude<Direction, 'center'>, string> = {
  up: 'top-[calc(var(--pitch)*0.03)] left-1/2 -translate-x-1/2',
  down: 'bottom-[calc(var(--pitch)*0.03)] left-1/2 -translate-x-1/2',
  left: 'left-[calc(var(--pitch)*0.045)] top-1/2 -translate-y-1/2',
  right: 'right-[calc(var(--pitch)*0.045)] top-1/2 -translate-y-1/2',
}

/** キー1個の見た目（キーボード内で絶対配置） */
export default function KeyCap({ view, highlight, background = 'bg-white', selected, className = '', style, children, ...rest }: Props) {
  const { rect, legends, inherited = {} } = view
  const labelClass = (dir: Direction) =>
    [
      highlight === dir ? 'rounded bg-blue-600 px-[calc(var(--pitch)*0.02)] text-white!' : '',
      inherited[dir] ? 'opacity-35' : '',
    ].join(' ')

  return (
    <div
      className={`absolute select-none border-r-2 border-b-2 border-slate-400 ${background} ${className}`}
      style={{
        left: `calc(var(--pitch) * ${rect.x})`,
        top: `calc(var(--pitch) * ${rect.y})`,
        width: `calc(var(--pitch) * ${rect.w})`,
        height: `calc(var(--pitch) * ${rect.h})`,
        ...style,
      }}
      {...rest}
    >
      {view.trackpad && (
        <div className="pointer-events-none absolute inset-[calc(var(--pitch)*0.04)] border border-dashed border-slate-400" />
      )}
      <div
        className={`pointer-events-none absolute inset-0 flex items-center justify-center text-center font-extrabold leading-none text-slate-700 ${
          [...(legends.center ?? '')].length > 1 ? 'text-[calc(var(--pitch)*0.155)]' : 'text-[calc(var(--pitch)*0.24)]'
        }`}
      >
        <span className={labelClass('center')}>{legends.center}</span>
      </div>
      {SLIDE_DIRECTIONS.map((dir) => {
        const label = legends[dir]
        if (!label) return null
        return (
          <span
            key={dir}
            className={`pointer-events-none absolute whitespace-nowrap text-[calc(var(--pitch)*0.115)] font-bold text-blue-600 ${LABEL_POS[dir as Exclude<Direction, 'center'>]} ${labelClass(dir)}`}
          >
            {label}
          </span>
        )
      })}
      {view.subLegend && (
        <span className="pointer-events-none absolute right-[calc(var(--pitch)*0.045)] bottom-[calc(var(--pitch)*0.03)] text-[calc(var(--pitch)*0.1)] font-bold text-red-600">
          [{view.subLegend}]
        </span>
      )}
      {selected && <div className="pointer-events-none absolute -inset-[2px] z-10 border-[3px] border-red-500" />}
      {children}
    </div>
  )
}
