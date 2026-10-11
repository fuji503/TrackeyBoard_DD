import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_KEYMAP } from '../data/keymaps'
import { normalizeGestureConfig, type GestureConfig } from '../features/gesture/types'
import { parseKeymap } from '../features/keymap/binding'
import type { Keymap } from '../types/keymap'
import { AppStateContext, type AppState } from './appState'

const KEYMAP_KEY = 'tbdd.keymap'
const GESTURE_KEY = 'tbdd.gestureConfig'

/** 保存値を読み込む。壊れていれば fallback */
function load<T>(key: string, parse: (data: unknown) => T, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? parse(JSON.parse(raw)) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 保存できなくても動作は継続する
  }
}

function withoutSettings({ settings: _settings, ...keymap }: Keymap): Keymap {
  return keymap
}

export default function AppStateProvider({ children }: { children: ReactNode }) {
  const [keymap, setKeymapState] = useState<Keymap>(() =>
    load(KEYMAP_KEY, (d) => withoutSettings(parseKeymap(d)), DEFAULT_KEYMAP),
  )
  const [gesture, setGesture] = useState<GestureConfig>(() =>
    load(GESTURE_KEY, (d) => normalizeGestureConfig(d as Partial<GestureConfig>), normalizeGestureConfig()),
  )

  useEffect(() => save(KEYMAP_KEY, keymap), [keymap])
  useEffect(() => save(GESTURE_KEY, gesture), [gesture])

  const setKeymap = useCallback((km: Keymap) => setKeymapState(withoutSettings(km)), [])

  const importKeymap = useCallback((km: Keymap) => {
    setKeymapState(withoutSettings(km))
    if (km.settings?.gesture) setGesture(normalizeGestureConfig(km.settings.gesture))
  }, [])

  const value = useMemo<AppState>(
    () => ({
      keymap,
      setKeymap,
      gesture,
      setGesture,
      resetKeymap: () => setKeymapState(DEFAULT_KEYMAP),
      importKeymap,
      exportKeymap: () => ({ ...keymap, settings: { gesture } }),
    }),
    [keymap, setKeymap, gesture, importKeymap],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
