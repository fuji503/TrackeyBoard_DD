import { useState } from 'react'

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

/** 刻み幅の小数桁で丸める（0.1 + 0.2 のような誤差を消す） */
function roundToStep(value: number, step: number): number {
  const decimals = (String(step).split('.')[1] ?? '').length
  return Number(value.toFixed(decimals))
}

/** スライダー・数値入力・±ボタンで1つの値を設定する行 */
export default function SliderRow({ label, value, min, max, step, unit, note, onChange }: Props) {
  // 入力途中の文字列。フォーカス中だけ使い、確定時に数値へ変換する
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (v: number) => {
    if (Number.isFinite(v)) onChange(roundToStep(Math.min(max, Math.max(min, v)), step))
  }

  const commitDraft = () => {
    if (draft !== null && draft.trim() !== '') commit(Number(draft))
    setDraft(null)
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
      <input
        type="number"
        inputMode="decimal"
        aria-label={`${label}の値`}
        min={min}
        max={max}
        step={step}
        value={draft ?? value}
        onFocus={() => setDraft(String(value))}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="w-14 shrink-0 rounded border border-slate-300 px-1 py-0.5 text-right font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
      />
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
