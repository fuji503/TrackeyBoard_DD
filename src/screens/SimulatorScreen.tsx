import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import GestureSettings from '../components/GestureSettings'
import HistoryLog, { type LogEntry } from '../components/HistoryLog'
import Keyboard from '../components/Keyboard'
import KeyboardSizeSettings from '../components/KeyboardSizeSettings'
import TextDisplay from '../components/TextDisplay'
import { LAYOUT_COLS, LAYOUT_V35, type KeyDef } from '../data/layoutV35'
import { DEFAULT_GESTURE_CONFIG, type GestureEvent, type GestureKind } from '../features/gesture/types'
import { DEFAULT_KEYBOARD_SIZE, resolvePitchPx } from '../features/keyboardSize'
import { EMPTY_BUFFER, applyEdit, labelToEdit } from '../features/text/textBuffer'
import { useLocalStorage } from '../hooks/useLocalStorage'

const MAX_LOG = 200

/** 入力として文字を出すイベント */
const OUTPUT_KINDS: GestureKind[] = ['tap', 'holdStart', 'holdRepeat', 'glide']

function formatTime(d: Date): string {
  return `${d.toLocaleTimeString('ja-JP', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

/** 要素の幅を追跡する */
function useElementWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setWidth(el.clientWidth))
    observer.observe(el)
    setWidth(el.clientWidth)
    return () => observer.disconnect()
  }, [])
  return [ref, width] as const
}

export default function SimulatorScreen() {
  const [buffer, setBuffer] = useState(EMPTY_BUFFER)
  const [showWhitespace, setShowWhitespace] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])
  const [config, setConfig] = useLocalStorage('tbdd.gestureConfig', DEFAULT_GESTURE_CONFIG)
  const [size, setSize] = useLocalStorage('tbdd.keyboardSize', DEFAULT_KEYBOARD_SIZE)
  const [keyboardAreaRef, keyboardAreaWidth] = useElementWidth()
  const nextId = useRef(0)

  // 左端の枠線 2px を除いた幅で列数分割する
  const pitchPx = resolvePitchPx(size, keyboardAreaWidth - 2, LAYOUT_COLS)

  const handleGesture = useCallback((key: KeyDef, event: GestureEvent) => {
    const label = key.labels[event.direction] ?? ''
    const edit = OUTPUT_KINDS.includes(event.kind) ? labelToEdit(label) : null
    if (edit) setBuffer((b) => applyEdit(b, edit))
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
    setLog((l) => [...l, entry].slice(-MAX_LOG))
  }, [])

  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Panel
          title="キー入力テキスト欄"
          action={
            <>
              <label className="flex items-center gap-1 font-normal text-slate-500">
                <input
                  type="checkbox"
                  checked={showWhitespace}
                  onChange={(e) => setShowWhitespace(e.target.checked)}
                />
                空白・改行を表示
              </label>
              <ClearButton onClick={() => setBuffer(EMPTY_BUFFER)} />
            </>
          }
        >
          <TextDisplay buffer={buffer} showWhitespace={showWhitespace} />
        </Panel>

        <Panel title="入力履歴（ジェスチャー）" action={<ClearButton onClick={() => setLog([])} />}>
          <HistoryLog entries={log} />
        </Panel>

        <Panel title="設定コンソール">
          <div className="flex h-full flex-col gap-3 overflow-y-auto p-2 text-xs">
            <KeyboardSizeSettings size={size} pitchPx={pitchPx} onChange={setSize} />
            <hr className="border-slate-200" />
            <GestureSettings config={config} onChange={setConfig} />
          </div>
        </Panel>
      </div>

      {/* キーボードが画面より大きい場合は横スクロールで見られるようにする */}
      <div ref={keyboardAreaRef} className="w-full overflow-x-auto">
        <div className="mx-auto w-fit">
          <Keyboard keys={LAYOUT_V35} config={config} pitchPx={pitchPx} onGesture={handleGesture} />
        </div>
      </div>
    </div>
  )
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex h-60 flex-col overflow-hidden rounded border border-slate-300 bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
        <span className="truncate">{title}</span>
        <span className="flex shrink-0 items-center gap-2">{action}</span>
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
