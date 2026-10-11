import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import GestureSettings from '../components/GestureSettings'
import HistoryLog, { type LogEntry } from '../components/HistoryLog'
import Keyboard, { KEYBOARD_BORDER_PX } from '../components/Keyboard'
import ConsoleSection from '../components/ConsoleSection'
import KeyboardSizeSettings from '../components/KeyboardSizeSettings'
import { TrackpadSettings, TrackpointSettings } from '../components/PointerSettings'
import TextDisplay, { type Ripple } from '../components/TextDisplay'
import type { GestureEvent } from '../features/gesture/types'
import { DEFAULT_KEYBOARD_SIZE, resolvePitchPx } from '../features/keyboardSize'
import {
  INITIAL_ENGINE_STATE,
  OS_SELECT_TIMEOUT_MS,
  cancelOsSelect,
  handleGesture as runEngine,
  setMode,
  type EngineResult,
  type HidLogItem,
} from '../features/keymap/engine'
import { buildKeyViews, layoutBounds } from '../features/keymap/view'
import { DEFAULT_POINTER_CONFIG } from '../features/pointer/config'
import { MouseLogAggregator } from '../features/pointer/mouseLog'
import type { PointerOutput } from '../features/pointer/output'
import { EMPTY_BUFFER, applyEdit } from '../features/text/textBuffer'
import { useElementWidth } from '../hooks/useElementWidth'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAppState } from '../state/appState'
import { MODE_LABELS, OS_LABELS, type InputMode, type OsId } from '../types/keymap'
import { caretOffsetAt } from '../utils/textHitTest'

const MAX_LOG = 200
/** ホイール1段あたりのスクロール量 (px) */
const WHEEL_PX = 20
const RIPPLE_MS = 500
const INITIAL_CURSOR = { x: 40, y: 40 }

function formatTime(d: Date): string {
  return `${d.toLocaleTimeString('ja-JP', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`
}

export default function SimulatorScreen() {
  const { keymap, gesture: config, setGesture: setConfig, pointer, setPointer } = useAppState()
  const [buffer, setBuffer] = useState(EMPTY_BUFFER)
  const [showWhitespace, setShowWhitespace] = useState(false)
  const [log, setLog] = useState<LogEntry[]>([])
  const [size, setSize] = useLocalStorage('tbdd.keyboardSize', DEFAULT_KEYBOARD_SIZE)
  const [keyboardAreaRef, keyboardAreaWidth] = useElementWidth()
  // ジェスチャーは連続して届くので、最新状態は ref で持ち、表示用に state へ写す
  const engineRef = useRef(INITIAL_ENGINE_STATE)
  const [engine, setEngine] = useState(INITIAL_ENGINE_STATE)
  const nextId = useRef(0)
  // 仮想マウスカーソル（テキスト欄の左上からの px）
  const textRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef(INITIAL_CURSOR)
  const [cursor, setCursor] = useState(INITIAL_CURSOR)
  const [ripples, setRipples] = useState<Ripple[]>([])
  const mouseLog = useRef(new MouseLogAggregator())
  /** 左ボタンを押している間はドラッグで範囲選択する */
  const leftHeld = useRef(false)

  const views = useMemo(() => buildKeyViews(keymap), [keymap])
  const pitchPx = resolvePitchPx(size, keyboardAreaWidth - KEYBOARD_BORDER_PX, layoutBounds(keymap).cols)

  const appendLogs = useCallback(
    (logs: HidLogItem[], keyIndex: number | null, event: GestureEvent | null) => {
      if (logs.length === 0) return
      const time = formatTime(new Date())
      const entries: LogEntry[] = logs.map((item) => ({
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

  const apply = useCallback(
    (result: EngineResult, keyIndex: number | null, event: GestureEvent | null) => {
      engineRef.current = result.state
      setEngine(result.state)
      if (result.edits.length > 0) setBuffer((b) => result.edits.reduce(applyEdit, b))
      appendLogs(result.logs, keyIndex, event)
    },
    [appendLogs],
  )

  const changeMode = useCallback(
    (mode: InputMode) => {
      // ポインタ操作に入るときは、積算中の移動を区切っておく
      appendLogs(mouseLog.current.flush(), null, null)
      apply(setMode(engineRef.current, mode), null, null)
    },
    [apply, appendLogs],
  )

  /** 仮想カーソル位置に文字カーソルを置く（select ならドラッグで範囲選択） */
  const placeCaretAtCursor = useCallback((select: boolean) => {
    const el = textRef.current
    if (!el) return
    const { x, y } = cursorRef.current
    const rect = el.getBoundingClientRect()
    setBuffer((b) =>
      applyEdit(b, { type: 'setCaret', pos: caretOffsetAt(el, rect.left + x, rect.top + y, b.text.length), select }),
    )
  }, [])

  /** クリックの目印を出し、左クリックなら文字カーソルをその位置へ移す */
  const clickAtCursor = useCallback(
    (button: Ripple['button']) => {
      const { x, y } = cursorRef.current
      const id = nextId.current++
      setRipples((r) => [...r, { id, x, y, button }])
      setTimeout(() => setRipples((r) => r.filter((p) => p.id !== id)), RIPPLE_MS)
      if (button === 'left') placeCaretAtCursor(false)
    },
    [placeCaretAtCursor],
  )

  const handlePointer = useCallback(
    (out: PointerOutput) => {
      appendLogs(mouseLog.current.add(out), null, null)
      const el = textRef.current
      switch (out.type) {
        case 'move': {
          const w = el?.clientWidth ?? 0
          const h = el?.clientHeight ?? 0
          const c = cursorRef.current
          cursorRef.current = {
            x: Math.min(Math.max(0, c.x + out.dx), Math.max(0, w - 1)),
            y: Math.min(Math.max(0, c.y + out.dy), Math.max(0, h - 1)),
          }
          setCursor(cursorRef.current)
          if (leftHeld.current) placeCaretAtCursor(true)
          break
        }
        case 'scroll':
          if (el) {
            el.scrollTop += out.dy * WHEEL_PX
            el.scrollLeft += out.dx * WHEEL_PX
          }
          break
        case 'button':
          if (out.button === 'left') leftHeld.current = out.pressed
          if (out.pressed) clickAtCursor(out.button)
          break
        case 'click':
          clickAtCursor(out.button)
          break
        case 'exitTrackpad':
          leftHeld.current = false
          changeMode('keyboard')
          break
        case 'trackpoint':
          leftHeld.current = false
          changeMode(out.active ? 'trackpoint' : 'keyboard')
          break
      }
    },
    [appendLogs, changeMode, clickAtCursor, placeCaretAtCursor],
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
        <Panel title="HIDキーコード履歴" action={<ClearButton onClick={() => setLog([])} />}>
          <HistoryLog entries={log} />
        </Panel>

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
          <TextDisplay
            buffer={buffer}
            showWhitespace={showWhitespace}
            scrollRef={textRef}
            cursor={engine.mode === 'keyboard' ? null : cursor}
            ripples={ripples}
          />
        </Panel>

        <Panel title="設定コンソール">
          <div className="flex h-full flex-col gap-2 overflow-y-auto p-2 text-xs">
            <KeyboardSizeSettings size={size} pitchPx={pitchPx} onChange={setSize} />
            <GestureSettings config={config} onChange={setConfig} />
            <ConsoleSection
              title="トラックパッド"
              onReset={() => setPointer({ ...pointer, ...pick(DEFAULT_POINTER_CONFIG, TRACKPAD_KEYS) })}
            >
              <TrackpadSettings config={pointer} onChange={setPointer} />
            </ConsoleSection>
            <ConsoleSection
              title="トラックポイント (VTP)"
              onReset={() => setPointer({ ...pointer, ...pick(DEFAULT_POINTER_CONFIG, TRACKPOINT_KEYS) })}
            >
              <TrackpointSettings config={pointer} onChange={setPointer} />
            </ConsoleSection>
          </div>
        </Panel>
      </div>

      {/* キーボードが画面より大きい場合は横スクロールで見られるようにする */}
      <div ref={keyboardAreaRef} className="w-full overflow-x-auto">
        <div className="mx-auto flex w-fit flex-col gap-1">
          <StatusBar os={engine.os} osSelect={engine.osSelect} mode={engine.mode} />
          <Keyboard
            keymap={keymap}
            config={config}
            pointer={pointer}
            mode={engine.mode}
            pitchPx={pitchPx}
            onGesture={handleGesture}
            onPointer={handlePointer}
          />
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

const TRACKPAD_KEYS = ['padSpeed', 'padAccel', 'scrollStep', 'naturalScroll', 'tapMaxMs', 'tapSlopMm'] as const
const TRACKPOINT_KEYS = [
  'vtpRadiusMm', 'vtpHoldMs', 'vtpSlopMm', 'vtpTapAction', 'vtpMoveAction',
  'stickDeadzoneMm', 'stickRangeMm', 'stickMaxSpeed', 'stickCurve', 'stickScrollSpeed',
] as const

function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  return Object.fromEntries(keys.map((k) => [k, obj[k]])) as Pick<T, K>
}

/** 実機の LED1（モード）に相当する色。BM 要件定義: 緑=キーボード, 橙=トラックパッド。トラックポイントは未定義のため青 */
const MODE_LED: Record<InputMode, string> = {
  keyboard: 'bg-green-500',
  trackpad: 'bg-orange-400',
  trackpoint: 'bg-blue-500',
}

/** 実機の LED1（モード）・LED2（OS。緑: Win/Linux/Android, 橙: Mac/iOS, 点滅: OS切替待機中）に相当する状態表示 */
function StatusBar({ os, osSelect, mode }: { os: OsId; osSelect: boolean; mode: InputMode }) {
  const apple = os === 'mac' || os === 'ios'
  return (
    <div className="flex items-center gap-3 text-xs text-slate-600">
      <span className="flex items-center gap-1">
        <span className={`h-2.5 w-2.5 rounded-full ${MODE_LED[mode]}`} />
        モード: <b>{MODE_LABELS[mode]}</b>
      </span>
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
