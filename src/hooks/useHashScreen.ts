import { useCallback, useSyncExternalStore } from 'react'

export const SCREENS = [
  { id: 'simulator', label: 'メイン画面（シミュレータ）' },
  { id: 'editor', label: 'キーボードエディタ' },
  { id: 'io', label: 'エクスポート / インポート' },
] as const

export type ScreenId = (typeof SCREENS)[number]['id']

const DEFAULT_SCREEN: ScreenId = 'simulator'

function readHash(): ScreenId {
  const id = window.location.hash.replace(/^#\/?/, '')
  return SCREENS.some((s) => s.id === id) ? (id as ScreenId) : DEFAULT_SCREEN
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

/**
 * 表示中の画面を URL ハッシュ (#/editor 等) で管理する。
 * GitHub Pages でもサーバ設定なしでリロード・共有ができる。
 */
export function useHashScreen(): [ScreenId, (id: ScreenId) => void] {
  const screen = useSyncExternalStore(subscribe, readHash)
  const setScreen = useCallback((id: ScreenId) => {
    window.location.hash = `/${id}`
  }, [])
  return [screen, setScreen]
}
