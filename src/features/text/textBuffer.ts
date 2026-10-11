/** カーソル付きテキスト。caret は text 中の位置（0〜text.length） */
export interface TextBuffer {
  text: string
  caret: number
}

export type CaretMove = 'left' | 'right' | 'up' | 'down' | 'home' | 'end'

export type EditAction =
  | { type: 'insert'; text: string }
  | { type: 'backspace' }
  | { type: 'delete' }
  | { type: 'move'; to: CaretMove }

export const EMPTY_BUFFER: TextBuffer = { text: '', caret: 0 }

export function applyEdit(buf: TextBuffer, action: EditAction): TextBuffer {
  const { text, caret } = buf
  switch (action.type) {
    case 'insert':
      return { text: text.slice(0, caret) + action.text + text.slice(caret), caret: caret + action.text.length }
    case 'backspace':
      if (caret === 0) return buf
      return { text: text.slice(0, caret - 1) + text.slice(caret), caret: caret - 1 }
    case 'delete':
      if (caret === text.length) return buf
      return { text: text.slice(0, caret) + text.slice(caret + 1), caret }
    case 'move':
      return { text, caret: moveCaret(text, caret, action.to) }
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
