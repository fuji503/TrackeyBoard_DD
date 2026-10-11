import { describe, expect, it } from 'vitest'
import { applyEdit, labelToEdit, type EditAction, type TextBuffer } from './textBuffer'

/** '|' の位置をカーソルとして表記する */
const buf = (s: string): TextBuffer => ({ text: s.replace('|', ''), caret: s.indexOf('|') })
const show = (b: TextBuffer) => b.text.slice(0, b.caret) + '|' + b.text.slice(b.caret)
const run = (s: string, ...actions: EditAction[]) => show(actions.reduce(applyEdit, buf(s)))
const move = (to: Extract<EditAction, { type: 'move' }>['to']): EditAction => ({ type: 'move', to })

describe('applyEdit', () => {
  it('カーソル位置に挿入する', () => {
    expect(run('ab|cd', { type: 'insert', text: 'X' })).toBe('abX|cd')
  })

  it('BS はカーソルの前、Del は後ろを消す', () => {
    expect(run('ab|cd', { type: 'backspace' })).toBe('a|cd')
    expect(run('ab|cd', { type: 'delete' })).toBe('ab|d')
    expect(run('|ab', { type: 'backspace' })).toBe('|ab')
    expect(run('ab|', { type: 'delete' })).toBe('ab|')
  })

  it('左右は端で止まる', () => {
    expect(run('|ab', move('left'))).toBe('|ab')
    expect(run('ab|', move('right'))).toBe('ab|')
    expect(run('a|b', move('right'))).toBe('ab|')
  })

  it('Home / End は行頭・行末', () => {
    expect(run('xx\nab|cd\nyy', move('home'))).toBe('xx\n|abcd\nyy')
    expect(run('xx\nab|cd\nyy', move('end'))).toBe('xx\nabcd|\nyy')
  })

  it('上下は桁を保ち、短い行では行末に寄せる', () => {
    expect(run('abcd\nef|gh', move('up'))).toBe('ab|cd\nefgh')
    expect(run('ab\nefg|h', move('up'))).toBe('ab|\nefgh')
    expect(run('ab|cd\nef', move('down'))).toBe('abcd\nef|')
    expect(run('a|b', move('up'))).toBe('|ab')
    expect(run('a|b', move('down'))).toBe('ab|')
  })
})

describe('labelToEdit', () => {
  it('1文字は小文字で入力、特殊キーは対応操作、修飾キーは null', () => {
    expect(labelToEdit('Q')).toEqual({ type: 'insert', text: 'q' })
    expect(labelToEdit('¥')).toEqual({ type: 'insert', text: '¥' })
    expect(labelToEdit('Space')).toEqual({ type: 'insert', text: ' ' })
    expect(labelToEdit('←')).toEqual({ type: 'move', to: 'left' })
    expect(labelToEdit('Shift')).toBeNull()
  })
})
