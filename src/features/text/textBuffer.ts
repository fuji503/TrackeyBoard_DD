/**
 * カーソル付きテキスト。caret は text 中の位置（0〜text.length）。
 * anchor があれば anchor〜caret が選択範囲（PC と同じく、選択の起点と現在位置）
 */
export interface TextBuffer {
  text: string
  caret: number
  anchor?: number
}

export type CaretMove = 'left' | 'right' | 'up' | 'down' | 'home' | 'end'

export type EditAction =
  | { type: 'insert'; text: string }
  | { type: 'backspace' }
  | { type: 'delete' }
  /** select: Shift + 矢印などで選択範囲を広げる */
  | { type: 'move'; to: CaretMove; select?: boolean }
  /** マウスでカーソルを置く。select ならドラッグで選択範囲を広げる */
  | { type: 'setCaret'; pos: number; select?: boolean }

export const EMPTY_BUFFER: TextBuffer = { text: '', caret: 0 }

/** 選択範囲 [開始, 終了)。選択していなければ null */
export function selectionRange(buf: TextBuffer): [number, number] | null {
  if (buf.anchor === undefined || buf.anchor === buf.caret) return null
  return [Math.min(buf.anchor, buf.caret), Math.max(buf.anchor, buf.caret)]
}

/** 選択範囲を text で置き換える（選択なしならカーソル位置に挿入） */
function replaceSelection(buf: TextBuffer, text: string): TextBuffer {
  const [start, end] = selectionRange(buf) ?? [buf.caret, buf.caret]
  return { text: buf.text.slice(0, start) + text + buf.text.slice(end), caret: start + text.length }
}

export function applyEdit(buf: TextBuffer, action: EditAction): TextBuffer {
  const { text, caret } = buf
  const selection = selectionRange(buf)
  switch (action.type) {
    case 'insert':
      return replaceSelection(buf, action.text)
    case 'backspace':
      if (selection) return replaceSelection(buf, '')
      if (caret === 0) return { text, caret }
      return { text: text.slice(0, caret - 1) + text.slice(caret), caret: caret - 1 }
    case 'delete':
      if (selection) return replaceSelection(buf, '')
      if (caret === text.length) return { text, caret }
      return { text: text.slice(0, caret) + text.slice(caret + 1), caret }
    case 'move':
      if (action.select) return { text, caret: moveCaret(text, caret, action.to), anchor: buf.anchor ?? caret }
      // 選択中に左右を押すと、選択範囲の端へカーソルを畳む（PC と同じ）
      if (selection && action.to === 'left') return { text, caret: selection[0] }
      if (selection && action.to === 'right') return { text, caret: selection[1] }
      return { text, caret: moveCaret(text, caret, action.to) }
    case 'setCaret': {
      const pos = Math.min(Math.max(0, action.pos), text.length)
      return action.select ? { text, caret: pos, anchor: buf.anchor ?? caret } : { text, caret: pos }
    }
  }
}

function lineStart(text: string, pos: number): number {
  return text.lastIndexOf('\n', pos - 1) + 1
}

function lineEnd(text: string, pos: number): number {
  const i = text.indexOf('\n', pos)
  return i === -1 ? text.length : i
}

function moveCaret(text: string, caret: number, to: CaretMove): number {
  switch (to) {
    case 'left':
      return Math.max(0, caret - 1)
    case 'right':
      return Math.min(text.length, caret + 1)
    case 'home':
      return lineStart(text, caret)
    case 'end':
      return lineEnd(text, caret)
    case 'up': {
      const start = lineStart(text, caret)
      if (start === 0) return 0
      const prevStart = lineStart(text, start - 1)
      return Math.min(prevStart + (caret - start), start - 1)
    }
    case 'down': {
      const end = lineEnd(text, caret)
      if (end === text.length) return text.length
      const nextStart = end + 1
      return Math.min(nextStart + (caret - lineStart(text, caret)), lineEnd(text, nextStart))
    }
  }
}
