import { useEffect, type RefObject } from 'react'

/**
 * 要素上でのブラウザ標準タッチ動作（スクロール、Pull-to-refresh、ピンチズーム、
 * 長押しメニュー）を抑止する。CSS の touch-action: none だけでは止まらない
 * iOS Safari 向けに、非 passive リスナで preventDefault する。
 */
export function usePreventTouchDefaults(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const prevent = (e: Event) => e.preventDefault()
    const opts = { passive: false } as const
    el.addEventListener('touchmove', prevent, opts)
    el.addEventListener('gesturestart', prevent, opts) // iOS のピンチ
    el.addEventListener('contextmenu', prevent)
    return () => {
      el.removeEventListener('touchmove', prevent)
      el.removeEventListener('gesturestart', prevent)
      el.removeEventListener('contextmenu', prevent)
    }
  }, [ref])
}
