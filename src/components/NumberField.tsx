import { useState } from 'react'
import { clampToRange } from '../utils/number'

interface Props {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  label: string
  className?: string
}

/** 数値入力欄。入力中は文字列のまま保持し、確定（Enter / フォーカス外し）時に範囲内へ丸めて反映する */
export default function NumberField({ value, min, max, step, onChange, label, className = 'w-14' }: Props) {
  const [draft, setDraft] = useState<string | null>(null)

  const commit = () => {
    if (draft !== null && draft.trim() !== '') {
      const v = Number(draft)
      if (Number.isFinite(v)) onChange(clampToRange(v, min, max, step))
    }
    setDraft(null)
  }

  return (
    <input
      type="number"
      inputMode="decimal"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={draft ?? value}
      onFocus={() => setDraft(String(value))}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className={`${className} shrink-0 rounded border border-slate-300 px-1 py-0.5 text-right font-mono [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`}
    />
  )
}
