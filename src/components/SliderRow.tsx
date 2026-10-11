import { clampToRange } from '../utils/number'
import NumberField from './NumberField'

interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  /** 値の後ろに添える補足（実寸換算など） */
  note?: string
  onChange: (value: number) => void
}

const STEP_BUTTON =
  'h-6 w-6 shrink-0 rounded border border-slate-300 bg-white leading-none text-slate-600 hover:bg-slate-100 disabled:opacity-40'

/** スライダー・数値入力・±ボタンで1つの値を設定する行 */
export default function SliderRow({ label, value, min, max, step, unit, note, onChange }: Props) {
  const commit = (v: number) => {
    if (Number.isFinite(v)) onChange(clampToRange(v, min, max, step))
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="w-20 shrink-0 whitespace-nowrap text-slate-600">{label}</span>
      <input
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => commit(Number(e.target.value))}
        className="w-0 min-w-12 flex-1"
      />
      <button
        type="button"
        aria-label={`${label}を下げる`}
        className={STEP_BUTTON}
        disabled={value <= min}
        onClick={() => commit(value - step)}
      >
        −
      </button>
      <NumberField label={`${label}の値`} value={value} min={min} max={max} step={step} onChange={onChange} />
      <button
        type="button"
        aria-label={`${label}を上げる`}
        className={STEP_BUTTON}
        disabled={value >= max}
        onClick={() => commit(value + step)}
      >
        ＋
      </button>
      <span className="w-24 shrink-0 whitespace-nowrap text-slate-500">
        {unit}
        {note && <span className="ml-1 text-slate-400">{note}</span>}
      </span>
    </div>
  )
}
