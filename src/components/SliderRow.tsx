interface Props {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}

export default function SliderRow({ label, value, min, max, step, display, onChange }: Props) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-20 shrink-0 whitespace-nowrap text-slate-600">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="min-w-0 flex-1"
      />
      <span className="shrink-0 whitespace-nowrap text-right font-mono">{display}</span>
    </label>
  )
}
