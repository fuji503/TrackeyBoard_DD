import { useState } from 'react'
import type { Direction } from '../../features/gesture/types'
import { behaviorLabel, parseBinding } from '../../features/keymap/binding'
import { setBinding, setGlide, setLegend } from '../../features/keymap/edit'
import type { Keymap } from '../../types/keymap'

interface Props {
  keymap: Keymap
  layerIndex: number
  keyIndex: number
  dir: Direction
  onChange: (keymap: Keymap) => void
}

const BUTTON = 'rounded border px-2 py-1 text-xs'
const ON = 'border-blue-600 bg-blue-600 text-white'
const OFF = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'

/**
 * 選択中のキー・方向のバインディング詳細。
 * 親で key を変えて再マウントさせることで、入力途中の値を選択切り替え時にリセットする
 */
export default function SlotEditor({ keymap, layerIndex, keyIndex, dir, onChange }: Props) {
  const layer = keymap.layers[layerIndex]
  const kb = layer.bindings[keyIndex] ?? {}
  const binding = kb[dir]
  const isBase = layer.activation.type === 'always'
  const [draft, setDraft] = useState(binding ?? '')
  const [error, setError] = useState<string | null>(null)
  const [legendDraft, setLegendDraft] = useState(kb.legend?.[dir] ?? '')

  const applyDraft = () => {
    const value = draft.trim()
    if (value === (binding ?? '')) return
    if (value === '') {
      onChange(setBinding(keymap, layerIndex, keyIndex, dir, undefined))
      return
    }
    try {
      parseBinding(value)
      setError(null)
      onChange(setLegend(setBinding(keymap, layerIndex, keyIndex, dir, value), layerIndex, keyIndex, dir))
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const autoLegend = binding ? behaviorLabel(parseBinding(binding)) : undefined
  const unsetText = isBase ? '未設定（何もしない）' : layer.activation.type === 'os' ? '未設定（ベースの設定を使う）' : '未設定'
  // グライドはベースレイヤーで方向ごとに設定する
  const baseIndex = keymap.layers.findIndex((l) => l.activation.type === 'always')
  const glide = keymap.layers[baseIndex]?.bindings[keyIndex]?.glide?.includes(dir) ?? false

  return (
    <div className="flex flex-col gap-2 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-slate-600">バインディング（直接入力も可）</span>
        <input
          type="text"
          value={draft}
          placeholder={unsetText}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
          onBlur={applyDraft}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className={`rounded border px-2 py-1 font-mono ${error ? 'border-red-500' : 'border-slate-300'}`}
          spellCheck={false}
          autoCapitalize="off"
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </label>

      {dir !== 'center' && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">入力方式</span>
          <button
            type="button"
            disabled={!isBase}
            className={`${BUTTON} ${!glide ? ON : OFF} disabled:opacity-50`}
            onClick={() => onChange(setGlide(keymap, baseIndex, keyIndex, dir, false))}
          >
            フリック
          </button>
          <button
            type="button"
            disabled={!isBase}
            className={`${BUTTON} ${glide ? ON : OFF} disabled:opacity-50`}
            onClick={() => onChange(setGlide(keymap, baseIndex, keyIndex, dir, true))}
          >
            グライド
          </button>
          {!isBase && <span className="text-xs text-slate-400">ベースレイヤーで設定</span>}
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs font-bold text-slate-600">印字（空欄なら自動）</span>
        <input
          type="text"
          value={legendDraft}
          placeholder={autoLegend ?? ''}
          onChange={(e) => setLegendDraft(e.target.value)}
          onBlur={() => onChange(setLegend(keymap, layerIndex, keyIndex, dir, legendDraft.trim() || undefined))}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="rounded border border-slate-300 px-2 py-1"
        />
      </label>

      <button
        type="button"
        disabled={binding === undefined && kb.legend?.[dir] === undefined}
        className={`${BUTTON} ${OFF} self-start disabled:opacity-40`}
        onClick={() => onChange(setLegend(setBinding(keymap, layerIndex, keyIndex, dir, undefined), layerIndex, keyIndex, dir))}
      >
        この方向の設定を消す
      </button>
    </div>
  )
}
