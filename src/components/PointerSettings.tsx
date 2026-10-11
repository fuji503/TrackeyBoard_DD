import {
  POINTER_RANGES,
  type PointerConfig,
  type VtpMoveAction,
  type VtpTapAction,
} from '../features/pointer/config'
import SliderRow from './SliderRow'

type NumericKey = keyof typeof POINTER_RANGES

interface Props {
  config: PointerConfig
  onChange: (config: PointerConfig) => void
}

const TAP_LABELS: Record<VtpTapAction, string> = { key: '下のキーを入力', none: '何もしない' }
const MOVE_LABELS: Record<VtpMoveAction, string> = {
  key: '下のキーのフリック等',
  none: '何もしない',
  trackpoint: 'すぐトラックポイント',
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Record<T, string>
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="w-full text-slate-600">{label}</span>
      {(Object.keys(options) as T[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded border px-2 py-0.5 ${
            key === value ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          {options[key]}
        </button>
      ))}
    </div>
  )
}

export function TrackpadSettings({ config, onChange }: Props) {
  const row = (key: NumericKey, label: string, unit: string) => (
    <SliderRow
      key={key}
      label={label}
      value={config[key]}
      {...POINTER_RANGES[key]}
      unit={unit}
      onChange={(v) => onChange({ ...config, [key]: v })}
    />
  )
  return (
    <>
      {row('padSpeed', 'カーソル速度', 'px/mm')}
      {row('padAccel', '加速', '')}
      {row('scrollStep', 'スクロール幅', 'mm/段')}
      {row('tapMaxMs', 'タップ時間', 'ms')}
      {row('tapSlopMm', 'タップ距離', 'mm')}
      <label className="flex items-center gap-2 text-slate-600">
        <input
          type="checkbox"
          checked={config.naturalScroll === 1}
          onChange={(e) => onChange({ ...config, naturalScroll: e.target.checked ? 1 : 0 })}
        />
        ナチュラルスクロール（指と同じ向きに内容が動く）
      </label>
    </>
  )
}

export function TrackpointSettings({ config, onChange }: Props) {
  const row = (key: NumericKey, label: string, unit: string) => (
    <SliderRow
      key={key}
      label={label}
      value={config[key]}
      {...POINTER_RANGES[key]}
      unit={unit}
      onChange={(v) => onChange({ ...config, [key]: v })}
    />
  )
  return (
    <>
      <div className="text-[11px] text-slate-400">VTP への入り方</div>
      {row('vtpRadiusMm', 'VTP 半径', 'mm')}
      {row('vtpHoldMs', '移行時間', 'ms')}
      {row('vtpSlopMm', '動かし判定', 'mm')}
      <Choice
        label="移行前に離したとき"
        value={config.vtpTapAction}
        options={TAP_LABELS}
        onChange={(v) => onChange({ ...config, vtpTapAction: v })}
      />
      <Choice
        label="移行前に動かしたとき"
        value={config.vtpMoveAction}
        options={MOVE_LABELS}
        onChange={(v) => onChange({ ...config, vtpMoveAction: v })}
      />
      <div className="mt-1 text-[11px] text-slate-400">操作感（ずらし量 → カーソル速度）</div>
      {row('stickDeadzoneMm', '不感帯', 'mm')}
      {row('stickRangeMm', '最大ずらし', 'mm')}
      {row('stickMaxSpeed', '最高速度', 'px/s')}
      {row('stickCurve', '感度カーブ', '')}
      {row('stickScrollSpeed', 'スクロール', '段/s')}
    </>
  )
}
