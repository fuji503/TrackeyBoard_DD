import { describe, expect, it } from 'vitest'
import { applyEdit, type EditAction, type TextBuffer } from './textBuffer'

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

describe('範囲選択', () => {
  /** '[' を選択の起点 (anchor)、'|' をカーソルとして表記する */
  const sel = (s: string): TextBuffer => {
    const anchor = s.indexOf('[')
    const plain = s.replace('[', '')
    const caret = plain.indexOf('|')
    const text = plain.replace('|', '')
    return anchor === -1 ? { text, caret } : { text, caret, anchor: anchor < caret ? anchor : anchor - 1 }
  }
  const showSel = (b: TextBuffer) => {
    const chars = [...b.text]
    const marks: [number, string][] = [[b.caret, '|']]
    if (b.anchor !== undefined) marks.push([b.anchor, '['])
    marks.sort((x, y) => y[0] - x[0] || (x[1] === '|' ? -1 : 1))
    for (const [i, m] of marks) chars.splice(i, 0, m)
    return chars.join('')
  }
  const runSel = (s: string, ...actions: EditAction[]) => showSel(actions.reduce(applyEdit, sel(s)))

  it('Shift + 矢印で選択範囲を広げる', () => {
    expect(runSel('ab|cd', { type: 'move', to: 'right', select: true }, { type: 'move', to: 'right', select: true })).toBe('ab[cd|')
    expect(runSel('ab|cd', { type: 'move', to: 'home', select: true })).toBe('|ab[cd')
  })

  it('選択中の入力は置き換え、BS / Del は削除', () => {
    expect(runSel('a[bc|d', { type: 'insert', text: 'X' })).toBe('aX|d')
    expect(runSel('a[bc|d', { type: 'backspace' })).toBe('a|d')
    expect(runSel('a|bc[d', { type: 'delete' })).toBe('a|d')
  })

  it('選択中に左右を押すと端へ畳み、上下などは選択解除して移動', () => {
    expect(runSel('a[bc|d', { type: 'move', to: 'left' })).toBe('a|bcd')
    expect(runSel('a|bc[d', { type: 'move', to: 'right' })).toBe('abc|d')
    expect(runSel('a[bc|d', { type: 'move', to: 'end' })).toBe('abcd|')
  })

  it('マウス: 押した位置にカーソルを置き、ドラッグで選択', () => {
    expect(
      runSel('abcd|', { type: 'setCaret', pos: 1 }, { type: 'setCaret', pos: 3, select: true }, { type: 'setCaret', pos: 2, select: true }),
    ).toBe('a[b|cd')
    expect(runSel('a[bc|d', { type: 'setCaret', pos: 4 })).toBe('abcd|')
  })
})
