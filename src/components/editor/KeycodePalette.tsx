import { useState } from 'react'
import { behaviorLabel, parseBinding } from '../../features/keymap/binding'
import { BEHAVIOR_HELP, MODIFIER_WRAPPERS, PALETTE, wrapModifiers } from '../../features/keymap/palette'

interface Props {
  /** 現在のバインディング（一致するボタンを強調） */
  current?: string
  onPick: (binding: string) => void
}

const SPECIAL_LABELS: Record<string, string> = { '&none': 'なし', '&trans': '透過' }

/** キーコードを選んで割り当てるボタン群（画面イメージ下部） */
export default function KeycodePalette({ current, onPick }: Props) {
  const [tab, setTab] = useState(0)
  const [mods, setMods] = useState<string[]>([])
  const group = PALETTE[tab]

  const toggleMod = (fn: string) => setMods((m) => (m.includes(fn) ? m.filter((x) => x !== fn) : [...m, fn]))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap border-b border-slate-200">
        {PALETTE.map((g, i) => (
          <button
            key={g.title}
            type="button"
            onClick={() => setTab(i)}
            className={`px-3 py-1.5 text-sm ${
              i === tab ? 'border-b-2 border-blue-600 font-bold text-blue-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {g.title}
          </button>
        ))}
      </div>

      {group.modifiable && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span>修飾を付ける:</span>
          {MODIFIER_WRAPPERS.map((m) => (
            <label key={m.fn} className="flex items-center gap-1">
              <input type="checkbox" checked={mods.includes(m.fn)} onChange={() => toggleMod(m.fn)} />
              {m.label}
            </label>
          ))}
          <span className="text-slate-400">例: Ctrl + C でコピー</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {group.bindings.map((b) => {
          const binding = group.modifiable ? wrapModifiers(b, mods) : b
          const label = behaviorLabel(parseBinding(binding)) ?? SPECIAL_LABELS[b] ?? b
          const name = b.replace(/^&kp /, '')
          return (
            <button
              key={b}
              type="button"
              title={BEHAVIOR_HELP[b] ?? binding}
              onClick={() => onPick(binding)}
              className={`flex min-w-12 flex-col items-center rounded border px-1.5 py-1 ${
                binding === current
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm font-bold text-slate-800">{label}</span>
              <span className="text-[10px] text-slate-400">{name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
