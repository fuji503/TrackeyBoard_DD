import { DEFAULT_GESTURE_CONFIG, type GestureConfig } from '../features/gesture/types'
import { BM_KEY_PITCH_MM } from '../features/keyboardSize'
import SliderRow from './SliderRow'

type Unit = 'ms' | 'key'

const SETTINGS: { key: keyof GestureConfig; label: string; min: number; max: number; step: number; unit: Unit }[] = [
  { key: 'holdDelay', label: 'ホールド判定', min: 150, max: 1000, step: 10, unit: 'ms' },
  { key: 'repeatInterval', label: '連続入力間隔', min: 30, max: 300, step: 5, unit: 'ms' },
  { key: 'flickThreshold', label: 'フリック距離', min: 0.1, max: 0.8, step: 0.05, unit: 'key' },
  { key: 'glideStep', label: 'グライド幅', min: 0.1, max: 0.8, step: 0.05, unit: 'key' },
]

/** 距離系は実機のキーピッチで実寸換算して併記する */
function formatValue(value: number, unit: Unit): string {
  if (unit === 'ms') return `${value}ms`
  return `${value.toFixed(2)}キー (${(value * BM_KEY_PITCH_MM).toFixed(1)}mm)`
}

interface Props {
  config: GestureConfig
  onChange: (config: GestureConfig) => void
}

export default function GestureSettings({ config, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between font-bold text-slate-600">
        ジェスチャー判定
        <button
          type="button"
          className="rounded px-2 font-normal text-slate-500 hover:bg-slate-200"
          onClick={() => onChange(DEFAULT_GESTURE_CONFIG)}
        >
          既定値に戻す
        </button>
      </div>
      {SETTINGS.map((s) => (
        <SliderRow
          key={s.key}
          label={s.label}
          value={config[s.key]}
          min={s.min}
          max={s.max}
          step={s.step}
          display={formatValue(config[s.key], s.unit)}
          onChange={(v) => onChange({ ...config, [s.key]: v })}
        />
      ))}
    </div>
  )
}
