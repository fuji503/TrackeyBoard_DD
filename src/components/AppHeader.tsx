import { useState } from 'react'
import { SCREENS, type ScreenId } from '../hooks/useHashScreen'

// 表示は major.minor のみ（例: 0.2.0 → v0.2）
const APP_VERSION = __APP_VERSION__.split('.').slice(0, 2).join('.')
const APP_TITLE = `TrackeyBoardデジタルデモンストレータ v${APP_VERSION}`

interface Props {
  screen: ScreenId
  onSelect: (id: ScreenId) => void
}

export default function AppHeader({ screen, onSelect }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-slate-300 bg-slate-100 px-3">
        <button
          type="button"
          aria-label="メニューを開く"
          aria-expanded={open}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded hover:bg-slate-200"
          onClick={() => setOpen(true)}
        >
          <span className="h-0.5 w-6 bg-slate-800" />
          <span className="h-0.5 w-6 bg-slate-800" />
          <span className="h-0.5 w-6 bg-slate-800" />
        </button>
        <h1 className="flex-1 truncate text-center text-base font-medium text-slate-800">{APP_TITLE}</h1>
        {/* タイトルを中央に保つためのスペーサ */}
        <span className="w-9" />
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <nav
            className="relative flex w-72 max-w-[80vw] flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 items-center border-b border-slate-200 px-4 font-bold text-slate-700">
              メニュー
            </div>
            {SCREENS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`px-4 py-3 text-left ${
                  s.id === screen ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => {
                  onSelect(s.id)
                  setOpen(false)
                }}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
