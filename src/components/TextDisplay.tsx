import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { TextBuffer } from '../features/text/textBuffer'

interface Props {
  buffer: TextBuffer
  /** 空白・タブ・改行を記号で表示する */
  showWhitespace: boolean
}

const WHITESPACE_MARK: Record<string, string> = { ' ': '□', '\t': '→\t', '\n': '↵\n' }

function render(text: string, showWhitespace: boolean): ReactNode {
  if (!showWhitespace) return text
  return text.split(/([ \t\n])/).map((part, i) =>
    part in WHITESPACE_MARK ? (
      <span key={i} className="text-slate-400">
        {WHITESPACE_MARK[part]}
      </span>
    ) : (
      part
    ),
  )
}

/** 点滅カーソル付きのテキスト表示（OS のキーボードが出ないよう入力欄は使わない） */
export default function TextDisplay({ buffer, showWhitespace }: Props) {
  const caretRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    caretRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [buffer])

  return (
    <div className="h-full overflow-y-auto p-2 font-mono text-sm break-all whitespace-pre-wrap">
      {render(buffer.text.slice(0, buffer.caret), showWhitespace)}
      {/* key を変えて入力のたびに点滅をリセットし、入力直後は必ず表示させる */}
      <span
        key={`${buffer.text.length}-${buffer.caret}`}
        ref={caretRef}
        className="-mx-px inline-block h-[1.2em] animate-[caret-blink_1s_step-end_infinite] border-l-2 border-blue-600 align-text-bottom"
      />
      {render(buffer.text.slice(buffer.caret), showWhitespace)}
      {buffer.text === '' && (
        <span className="text-slate-400">キーボードから入力した文字がここに表示されます</span>
      )}
    </div>
  )
}
