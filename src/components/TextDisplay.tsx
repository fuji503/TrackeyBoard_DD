import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { MouseButton } from '../features/keymap/binding'
import type { TextBuffer } from '../features/text/textBuffer'

export interface Ripple {
  id: number
  x: number
  y: number
  button: MouseButton
}

interface Props {
  buffer: TextBuffer
  /** 空白・タブ・改行を記号で表示する */
  showWhitespace: boolean
  /** スクロールする本文の要素（クリック位置の判定・スクロールに使う） */
  scrollRef: RefObject<HTMLDivElement | null>
  /** 仮想マウスカーソルの位置（パネル左上からの px）。null なら非表示 */
  cursor: { x: number; y: number } | null
  ripples: Ripple[]
}

const WHITESPACE_MARK: Record<string, string> = { ' ': '□', '\t': '→\t', '\n': '↵\n' }
const RIPPLE_COLOR: Record<MouseButton, string> = { left: 'border-blue-500', middle: 'border-emerald-500', right: 'border-rose-500' }

/** 1文字ずつ span にする。data-i は buffer.caret と同じ単位（UTF-16 の位置） */
function renderChars(text: string, offset: number, showWhitespace: boolean) {
  let i = offset
  return [...text].map((ch) => {
    const start = i
    i += ch.length
    const mark = showWhitespace ? WHITESPACE_MARK[ch] : undefined
    return (
      <span key={start} data-i={start} data-nl={ch === '\n' ? '1' : undefined} className={mark ? 'text-slate-400' : undefined}>
        {mark ?? ch}
      </span>
    )
  })
}

/**
 * 点滅カーソル付きのテキスト表示（OS のキーボードが出ないよう入力欄は使わない）。
 * トラックパッド / トラックポイントモードでは仮想マウスカーソルを重ねて表示する
 */
export default function TextDisplay({ buffer, showWhitespace, scrollRef, cursor, ripples }: Props) {
  const caretRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    caretRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [buffer])

  const before = buffer.text.slice(0, buffer.caret)
  const after = buffer.text.slice(buffer.caret)

  return (
    <div className="relative h-full overflow-hidden">
      <div ref={scrollRef} className="h-full overflow-auto p-2 font-mono text-sm break-all whitespace-pre-wrap">
        {renderChars(before, 0, showWhitespace)}
        {/* key を変えて入力のたびに点滅をリセットし、入力直後は必ず表示させる */}
        <span
          key={`${buffer.text.length}-${buffer.caret}`}
          ref={caretRef}
          className="-mx-px inline-block h-[1.2em] animate-[caret-blink_1s_step-end_infinite] border-l-2 border-blue-600 align-text-bottom"
        />
        {renderChars(after, buffer.caret, showWhitespace)}
        {buffer.text === '' && (
          <span className="text-slate-400">キーボードから入力した文字がここに表示されます</span>
        )}
      </div>
      {ripples.map((r) => (
        <span
          key={r.id}
          className={`pointer-events-none absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border-2 ${RIPPLE_COLOR[r.button]}`}
          style={{ left: r.x, top: r.y }}
        />
      ))}
      {cursor && (
        <svg
          className="pointer-events-none absolute drop-shadow"
          style={{ left: cursor.x, top: cursor.y }}
          width="14"
          height="21"
          viewBox="0 0 14 21"
          aria-label="仮想マウスカーソル"
        >
          <path d="M1 1 L1 17 L5 13 L8 20 L11 19 L8 12 L13 12 Z" fill="#111" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}
