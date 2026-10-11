import { useEffect, useState } from 'react'

/**
 * localStorage に保存される state（オブジェクト用）。
 * 保存値に無い項目は既定値で補うので、設定項目を後から増やしても壊れない。
 */
export function useLocalStorage<T extends object>(key: string, defaults: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // プライベートモード等で保存できなくても動作は継続する
    }
  }, [key, value])

  return [value, setValue] as const
}
