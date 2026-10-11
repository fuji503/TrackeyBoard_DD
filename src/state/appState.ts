import { createContext, useContext } from 'react'
import type { GestureConfig } from '../features/gesture/types'
import type { PointerConfig } from '../features/pointer/config'
import type { Keymap } from '../types/keymap'

/** 画面をまたいで共有する状態（ブラウザに保存される） */
export interface AppState {
  /** 編集中のキーマップ（settings は持たない。設定値は gesture 側） */
  keymap: Keymap
  setKeymap: (keymap: Keymap) => void
  gesture: GestureConfig
  setGesture: (gesture: GestureConfig) => void
  pointer: PointerConfig
  setPointer: (pointer: PointerConfig) => void
  /** 既定キーマップ（v3.5）に戻す */
  resetKeymap: () => void
  /** インポート: キーマップを差し替え、同梱の設定値があれば反映する */
  importKeymap: (keymap: Keymap) => void
  /** エクスポート用: 現在の設定値を同梱したキーマップ */
  exportKeymap: () => Keymap
}

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState(): AppState {
  const state = useContext(AppStateContext)
  if (!state) throw new Error('AppStateProvider の外で useAppState が呼ばれました')
  return state
}
