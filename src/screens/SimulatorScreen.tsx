import { useCallback, useRef, useState, type ReactNode } from 'react'
import Keyboard from '../components/Keyboard'
import { LAYOUT_V35, type KeyDef } from '../data/layoutV35'
import {
  DEFAULT_GESTURE_CONFIG,
  type Direction,
  type GestureConfig,
  type GestureEvent,
  type GestureKind,
} from '../features/gesture/types'

interface LogEntry {
  id: number
  time: string
  kind: GestureKind
  keyLabel: string
  direction: Direction
  output: string
}

const MAX_LOG = 200

const DIR_MARK: Record<Direction, string> = { center: '・', up: '↑', down: '↓', left: '←', right: '→' }

const KIND_STYLE: Record<GestureKind, string> = {
  tap: 'bg-sky-100 text-sky-800',
  holdStart: 'bg-amber-100 text-amber-800',
  holdRepeat: 'bg-amber-50 text-amber-700',
  holdEnd: 'bg-slate-100 text-slate-600',
  glide: 'bg-emerald-100 text-emerald-800',
}

/** 入力として文字を出すイベント */
const OUTPUT_KINDS: GestureKind[] = ['tap', 'holdStart', 'holdRepeat', 'glide']

/**
 * ラベルをテキスト欄へ反映する（フェーズ1の暫定処理。
 * フェーズ2で ZMK 風キーバインディング → HID コード経由に置き換える）
 */
function applyLabel(text: string, label: string): string {
  switch (label) {
    case 'BS':
      return text.slice(0, -1)
    case 'Ent':
      return text + '\n'
    case 'Space':
      return text + ' '
    case 'Tab':
      return text + '\t'
    case '↑':
    case '↓':
    case '←':
    case '→':
      return text // カーソル移動はテキスト欄では表現しない
  }
  return [...label].length === 1 ? text + label.toLowerCase() : text
}

function formatTime(d: Date): string {
  return `${d.toLocaleTimeString('ja-JP', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

export default function SimulatorScreen() {
  const [text, setText] = useState('')
  const [log, setLog] = useState<LogEntry[]>([])
  const [config, setConfig] = useState<GestureConfig>(DEFAULT_GESTURE_CONFIG)
  const nextId = useRef(0)

  const handleGesture = useCallback((key: KeyDef, event: GestureEvent) => {
    const label = key.labels[event.direction] ?? ''
    if (label && OUTPUT_KINDS.includes(event.kind)) {
      setText((t) => applyLabel(t, label))
    }
    // 連続入力のティックはログが埋まるので記録しない
    if (event.kind === 'holdRepeat') return
    const entry: LogEntry = {
      id: nextId.current++,
      time: formatTime(new Date()),
      kind: event.kind,
      keyLabel: key.labels.center ?? key.id,
      direction: event.direction,
      output: label,
    }
    setLog((l) => [entry, ...l].slice(0, MAX_LOG))
  }, [])

  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Panel title="キー入力テキスト欄" action={<ClearButton onClick={() => setText('')} />}>
          <textarea
            readOnly
            value={text}
            placeholder="キーボードから入力した文字がここに表示されます"
            className="h-full w-full resize-none bg-transparent p-2 font-mono text-sm outline-none"
          />
        </Panel>

        <Panel title="入力履歴（ジェスチャー）" action={<ClearButton onClick={() => setLog([])} />}>
          <ul className="h-full overflow-y-auto p-1 font-mono text-xs">
            {log.map((e) => (
              <li key={e.id} className="flex items-center gap-2 px-1 py-0.5">
                <span className="text-slate-400">{e.time}</span>
                <span className={`w-20 rounded px-1 text-center ${KIND_STYLE[e.kind]}`}>{e.kind}</span>
                <span className="w-14 truncate font-bold">{e.keyLabel}</span>
                <span className="w-4 text-center">{DIR_MARK[e.direction]}</span>
                <span className="truncate text-blue-700">{e.output || '—'}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="拡大縮小・コンソール">
          <GestureSettings config={config} onChange={setConfig} />
        </Panel>
      </div>

      <div className="mx-auto w-full max-w-5xl">
        <Keyboard keys={LAYOUT_V35} config={config} onGesture={handleGesture} />
      </div>
    </div>
  )
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex h-44 flex-col overflow-hidden rounded border border-slate-300 bg-white">
      <header className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
        {title}
        {action}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  )
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="rounded px-2 font-normal text-slate-500 hover:bg-slate-200" onClick={onClick}>
      クリア
    </button>
  )
}

/** 実機のキーピッチ (mm)。距離系パラメータを実寸に換算して表示する */
const KEY_PITCH_MM = 17

type Unit = 'ms' | 'key'

const SETTINGS: { key: keyof GestureConfig; label: string; min: number; max: number; step: number; unit: Unit }[] = [
  { key: 'holdDelay', label: 'ホールド判定', min: 150, max: 1000, step: 10, unit: 'ms' },
  { key: 'repeatInterval', label: '連続入力間隔', min: 30, max: 300, step: 5, unit: 'ms' },
  { key: 'flickThreshold', label: 'フリック距離', min: 0.1, max: 0.8, step: 0.05, unit: 'key' },
  { key: 'glideStep', label: 'グライド幅', min: 0.1, max: 0.8, step: 0.05, unit: 'key' },
]

function formatValue(value: number, unit: Unit): string {
  if (unit === 'ms') return `${value}ms`
  return `${value.toFixed(2)}キー (${(value * KEY_PITCH_MM).toFixed(1)}mm)`
}

function GestureSettings({ config, onChange }: { config: GestureConfig; onChange: (c: GestureConfig) => void }) {
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 px-3 text-xs">
      {SETTINGS.map((s) => (
        <label key={s.key} className="flex items-center gap-2">
          <span className="w-20 shrink-0 whitespace-nowrap text-slate-600">{s.label}</span>
          <input
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={config[s.key]}
            onChange={(e) => onChange({ ...config, [s.key]: Number(e.target.value) })}
            className="min-w-0 flex-1"
          />
          <span className="shrink-0 whitespace-nowrap text-right font-mono">{formatValue(config[s.key], s.unit)}</span>
        </label>
      ))}
      <button
        type="button"
        className="mt-1 self-end rounded px-2 text-slate-500 hover:bg-slate-200"
        onClick={() => onChange(DEFAULT_GESTURE_CONFIG)}
      >
        既定値に戻す
      </button>
    </div>
  )
}
