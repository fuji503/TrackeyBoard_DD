import type { ReactNode } from 'react'

interface Props {
  title: string
  defaultOpen?: boolean
  /** 既定値に戻す等、見出し右側の操作 */
  onReset?: () => void
  children: ReactNode
}

/** 設定コンソールの折りたたみセクション */
export default function ConsoleSection({ title, defaultOpen = false, onReset, children }: Props) {
  return (
    <details open={defaultOpen} className="group border-b border-slate-200 pb-2 last:border-b-0">
      <summary className="flex cursor-pointer list-none items-center justify-between py-1 font-bold text-slate-600 select-none">
        <span>
          <svg
            className="mr-1 inline-block h-3 w-3 align-[-1px] text-slate-400 transition-transform group-open:rotate-90"
            viewBox="0 0 12 12"
            aria-hidden
          >
            <path d="M4 2 L8 6 L4 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {title}
        </span>
        {onReset && (
          <button
            type="button"
            className="rounded px-2 font-normal text-slate-500 hover:bg-slate-200"
            onClick={(e) => {
              e.preventDefault()
              onReset()
            }}
          >
            既定値に戻す
          </button>
        )}
      </summary>
      <div className="flex flex-col gap-1.5 pt-1">{children}</div>
    </details>
  )
}
