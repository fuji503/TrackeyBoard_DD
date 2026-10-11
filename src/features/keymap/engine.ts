import { OS_LABELS, type Keymap, type OsId } from '../../types/keymap'
import type { GestureEvent } from '../gesture/types'
import type { EditAction } from '../text/textBuffer'
import { activeLayers, parseBinding, resolveBinding } from './binding'
import {
  SHORTCUT_MASK,
  formatHid,
  formatMods,
  formatUsage,
  isModifierUsage,
  jisChar,
  modBit,
  type Keycode,
} from './keycodes'

/**
 * キーボード（ファームウェア相当）の状態
 * - heldMods: ホールド中の修飾キー。キー番号 → 修飾ビット
 */
export interface EngineState {
  os: OsId
  osSelect: boolean
  heldMods: Record<number, number>
}

export const INITIAL_ENGINE_STATE: EngineState = { os: 'win', osSelect: false, heldMods: {} }

/** OS 切替待機モードの自動キャンセルまでの時間 */
export const OS_SELECT_TIMEOUT_MS = 3000

/** HID 履歴に出す1件 */
export interface HidLogItem {
  action: 'tap' | 'glide' | 'hold' | 'release' | 'mode'
  binding: string
  /** "KC_LSFT+KC_2" 形式 */
  hid?: string
  /** "0x1F" 形式 */
  usage?: string
  /** ホスト (JIS) で入力される文字 */
  char?: string
  note?: string
}

export interface EngineResult {
  state: EngineState
  logs: HidLogItem[]
  /** テキスト欄（ホスト OS 側）への反映 */
  edits: EditAction[]
}

const heldMask = (state: EngineState) => Object.values(state.heldMods).reduce((a, b) => a | b, 0)

const HID_EDITS: Record<number, EditAction> = {
  0x28: { type: 'insert', text: '\n' },
  0x2a: { type: 'backspace' },
  0x2b: { type: 'insert', text: '\t' },
  0x4c: { type: 'delete' },
  0x4a: { type: 'move', to: 'home' },
  0x4d: { type: 'move', to: 'end' },
  0x4f: { type: 'move', to: 'right' },
  0x50: { type: 'move', to: 'left' },
  0x51: { type: 'move', to: 'down' },
  0x52: { type: 'move', to: 'up' },
}

/** HID 入力をホスト OS (JIS 配列) が受け取ったときのテキスト編集 */
export function hidToEdit(kc: Keycode, mods: number): EditAction | null {
  if (kc.page !== 'keyboard' || mods & SHORTCUT_MASK) return null
  const edit = HID_EDITS[kc.usage]
  if (edit) return edit
  const c = jisChar(kc, mods)
  return c ? { type: 'insert', text: c } : null
}

export function cancelOsSelect(state: EngineState): EngineResult {
  if (!state.osSelect) return { state, logs: [], edits: [] }
  return {
    state: { ...state, osSelect: false },
    logs: [{ action: 'mode', binding: '', note: 'OS切替をキャンセル' }],
    edits: [],
  }
}

/** ジェスチャー1件を処理する */
export function handleGesture(
  state: EngineState,
  keymap: Keymap,
  keyIndex: number,
  event: GestureEvent,
): EngineResult {
  const none: EngineResult = { state, logs: [], edits: [] }
  const triggers = event.kind === 'tap' || event.kind === 'glide' || event.kind === 'holdStart'

  if (state.osSelect) {
    // 待機中は os_select レイヤーだけで解決。OS 指定以外のキーに触れたらキャンセル
    if (!triggers) return none
    const binding = resolveBinding(activeLayers(keymap, state.os, true), keyIndex, event.direction)
    const b = parseBinding(binding)
    if (b.type !== 'os_set') return cancelOsSelect(state)
    return {
      state: { ...state, os: b.os, osSelect: false },
      logs: [{ action: 'mode', binding, note: `OS切替: ${OS_LABELS[b.os]}` }],
      edits: [],
    }
  }

  // 修飾キーのリリースは、押したときの状態を使う（途中でレイヤーが変わっても離せるように）
  if (event.kind === 'holdEnd' && keyIndex in state.heldMods) {
    const { [keyIndex]: mods, ...rest } = state.heldMods
    const binding = resolveBinding(activeLayers(keymap, state.os, false), keyIndex, event.direction)
    return {
      state: { ...state, heldMods: rest },
      logs: [{ action: 'release', binding, hid: formatMods(mods) }],
      edits: [],
    }
  }

  const binding = resolveBinding(activeLayers(keymap, state.os, false), keyIndex, event.direction)
  const b = parseBinding(binding)

  switch (b.type) {
    case 'os_sel':
      if (!triggers) return none
      return {
        state: { ...state, osSelect: true },
        logs: [{ action: 'mode', binding, note: 'OS切替待機（Q:Win W:Mac E:Android R:iOS）' }],
        edits: [],
      }
    case 'tp_toggle':
      if (!triggers) return none
      return { state, logs: [{ action: 'mode', binding, note: 'トラックパッドモード切替（未実装）' }], edits: [] }
    case 'kp':
      return handleKeyPress(state, binding, b.keycode, keyIndex, event)
  }
  return none
}

function handleKeyPress(
  state: EngineState,
  binding: string,
  kc: Keycode,
  keyIndex: number,
  event: GestureEvent,
): EngineResult {
  const mods = heldMask(state) | kc.mods
  const report = { binding, hid: formatHid(kc, mods), usage: formatUsage(kc) }

  if (isModifierUsage(kc)) {
    switch (event.kind) {
      case 'holdStart':
        // 修飾キーのホールドは押しっぱなし（連続入力しない）
        return {
          state: { ...state, heldMods: { ...state.heldMods, [keyIndex]: modBit(kc) | kc.mods } },
          logs: [{ action: 'hold', ...report, note: '押下中' }],
          edits: [],
        }
      case 'tap':
      case 'glide':
        return { state, logs: [{ action: event.kind, ...report }], edits: [] }
    }
    return { state, logs: [], edits: [] }
  }

  const edit = hidToEdit(kc, mods)
  const char = jisChar(kc, mods)
  const edits = edit ? [edit] : []
  switch (event.kind) {
    case 'tap':
    case 'glide':
      return { state, logs: [{ action: event.kind, ...report, char }], edits }
    case 'holdStart':
      return { state, logs: [{ action: 'hold', ...report, char, note: '連続入力' }], edits }
    case 'holdRepeat':
      return { state, logs: [], edits }
    case 'holdEnd':
      return { state, logs: [{ action: 'release', ...report }], edits: [] }
  }
}
