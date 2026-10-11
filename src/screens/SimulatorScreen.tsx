import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import GestureSettings from '../components/GestureSettings'
import HistoryLog, { type LogEntry } from '../components/HistoryLog'
import Keyboard, { KEYBOARD_BORDER_PX } from '../components/Keyboard'
import KeyboardSizeSettings from '../components/KeyboardSizeSettings'
import TextDisplay from '../components/TextDisplay'
import type { GestureEvent } from '../features/gesture/types'
import { DEFAULT_KEYBOARD_SIZE, resolvePitchPx } from '../features/keyboardSize'
import {
  INITIAL_ENGINE_STATE,
  OS_SELECT_TIMEOUT_MS,
  cancelOsSelect,
  handleGesture as runEngine,
  type EngineResult,
} from '../features/keymap/engine'
import { buildKeyViews, layoutBounds } from '../features/keymap/view'
import { EMPTY_BUFFER, applyEdit } from '../features/text/textBuffer'
import { useElementWidth } from '../hooks/useElementWidth'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppState } from '../state/appState'
import { OS_LABELS, type OsId } from '../types/keymap'

const MAX_LOG = 200

function formatTime(d: Date): string {
  return `${d.toLocaleTimeString('ja-JP', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

export default function SimulatorScreen() {
  const { keymap, gesture: config, setGesture: setConfig } = useAppState()
  const [buffer, setBuffer] = useState(EMPTY_BUFFER)
  const [showWhitespace, setShowWhitespace] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])
  const [size, setSize] = useLocalStorage('tbdd.keyboardSize', DEFAULT_KEYBOARD_SIZE)
  const [keyboardAreaRef, keyboardAreaWidth] = useElementWidth()
  // ジェスチャーは連続して届くので、最新状態は ref で持ち、表示用に state へ写す
  const engineRef = useRef(INITIAL_ENGINE_STATE)
  const [engine, setEngine] = useState(INITIAL_ENGINE_STATE)
  const nextId = useRef(0)

  const views = useMemo(() => buildKeyViews(keymap), [keymap])
  const pitchPx = resolvePitchPx(size, keyboardAreaWidth - KEYBOARD_BORDER_PX, layoutBounds(keymap).cols)

  const apply = useCallback(
    (result: EngineResult, keyIndex: number | null, event: GestureEvent | null) => {
      engineRef.current = result.state
      setEngine(result.state)
      if (result.edits.length > 0) setBuffer((b) => result.edits.reduce(applyEdit, b))
      if (result.logs.length === 0) return
      const time = formatTime(new Date())
      const entries: LogEntry[] = result.logs.map((item) => ({
        ...item,
        id: nextId.current++,
        time,
        direction: event?.direction ?? 'center',
        keyLegend: keyIndex === null ? '' : (views[keyIndex]?.legends.center ?? ''),
      }))
      setLog((l) => [...l, ...entries].slice(-MAX_LOG))
    },
    [views],
  )

  const handleGesture = useCallback(
    (keyIndex: number, event: GestureEvent) => {
      apply(runEngine(engineRef.current, keymap, keyIndex, event), keyIndex, event)
    },
    [apply, keymap],
  )

  // OS 切替待機は一定時間で自動キャンセル
  useEffect(() => {
    if (!engine.osSelect) return
    const timer = setTimeout(() => apply(cancelOsSelect(engineRef.current), null, null), OS_SELECT_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [engine.osSelect, apply])

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

        <Panel title="HIDキーコード履歴" action={<ClearButton onClick={() => setLog([])} />}>
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
        <div className="mx-auto flex w-fit flex-col gap-1">
          <StatusBar os={engine.os} osSelect={engine.osSelect} />
          <Keyboard keymap={keymap} config={config} pitchPx={pitchPx} onGesture={handleGesture} />
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

/** 実機の LED2 に相当する状態表示（緑: Win/Linux/Android, 橙: Mac/iOS, 点滅: OS切替待機中） */
function StatusBar({ os, osSelect }: { os: OsId; osSelect: boolean }) {
  const apple = os === 'mac' || os === 'ios'
  return (
    <div className="flex items-center gap-3 text-xs text-slate-600">
      <span className="flex items-center gap-1">
        <span
          className={`h-2.5 w-2.5 rounded-full ${apple ? 'bg-orange-400' : 'bg-green-500'} ${osSelect ? 'animate-[caret-blink_0.5s_step-end_infinite]' : ''}`}
        />
        OS: <b>{OS_LABELS[os]}</b>
      </span>
      {osSelect && (
        <span className="text-orange-600">OS切替待機中: Q=Win/Linux, W=Mac, E=Android, R=iOS をタップ</span>
      )}
    </div>
  )
}
