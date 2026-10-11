import { DEFAULT_GESTURE_CONFIG, GESTURE_RANGES, type GestureConfig } from '../features/gesture/types'
import { BM_KEY_PITCH_MM } from '../features/keyboardSize'
import ConsoleSection from './ConsoleSection'
import SliderRow from './SliderRow'

type Unit = 'ms' | 'key'

const SETTINGS: { key: keyof GestureConfig; label: string; unit: Unit }[] = [
  { key: 'holdDelay', label: 'ホールド判定', unit: 'ms' },
  { key: 'repeatInterval', label: '連続入力間隔', unit: 'ms' },
  { key: 'flickThreshold', label: 'フリック距離', unit: 'key' },
  { key: 'glideStep', label: 'グライド幅', unit: 'key' },
]

/** 距離系は実機のキーピッチで実寸換算して併記する */
function mmNote(value: number, unit: Unit): string | undefined {
  return unit === 'key' ? `(${(value * BM_KEY_PITCH_MM).toFixed(1)}mm)` : undefined
}

interface Props {
  config: GestureConfig
  onChange: (config: GestureConfig) => void
}

export default function GestureSettings({ config, onChange }: Props) {
  return (
    <ConsoleSection title="ジェスチャー判定" defaultOpen onReset={() => onChange(DEFAULT_GESTURE_CONFIG)}>
      {SETTINGS.map((s) => (
        <SliderRow
          key={s.key}
          label={s.label}
          value={config[s.key]}
          {...GESTURE_RANGES[s.key]}
          unit={s.unit === 'ms' ? 'ms' : 'キー'}
          note={mmNote(config[s.key], s.unit)}
          onChange={(v) => onChange({ ...config, [s.key]: v })}
        />
      ))}
    </ConsoleSection>
  )
}
