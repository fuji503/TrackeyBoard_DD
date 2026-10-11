import { useState } from 'react'
import {
  addColumn,
  addKey,
  addRow,
  createGrid,
  nextFreeRect,
  removeKeys,
  removeLastColumn,
  removeLastRow,
  updateKey,
} from '../../features/keymap/edit'
import { layoutBounds } from '../../features/keymap/view'
import type { Keymap, PhysicalKey } from '../../types/keymap'
import NumberField from '../NumberField'

interface Props {
  keymap: Keymap
  selected: number | null
  overlaps: [number, number][]
  onChange: (keymap: Keymap, select?: number | null) => void
}

const BUTTON =
  'rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-40'

/** 1キーの位置・大きさの単位（キーピッチ） */
const UNIT = 0.25
const MAX_SIZE = 30

const FIELDS: { key: keyof Pick<PhysicalKey, 'x' | 'y' | 'w' | 'h'>; label: string; min: number }[] = [
  { key: 'x', label: '位置 X', min: 0 },
  { key: 'y', label: '位置 Y', min: 0 },
  { key: 'w', label: '幅', min: UNIT },
  { key: 'h', label: '高さ', min: UNIT },
]

/** キー配列（物理レイアウト）の編集 */
export default function LayoutEditor({ keymap, selected, overlaps, onChange }: Props) {
  const { cols, rows } = layoutBounds(keymap)
  const [gridRows, setGridRows] = useState(rows)
  const [gridCols, setGridCols] = useState(cols)
  const key = selected !== null ? keymap.layout.keys[selected] : undefined

  const add = () => {
    const { keymap: next, index } = addKey(keymap, nextFreeRect(keymap))
    onChange(next, index)
  }

  const remove = () => {
    if (selected === null) return
    onChange(
      removeKeys(keymap, (_, i) => i === selected),
      null,
    )
  }

  const create = () => {
    if (!window.confirm(`${gridRows} 行 × ${gridCols} 列の空のキー配列を作成します。現在のキー配列とキーマップは消えます。よろしいですか？`))
      return
    onChange(createGrid(keymap, gridRows, gridCols), 0)
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-slate-600">選択中のキー（単位: キーピッチ, {UNIT} 刻み）</h3>
        {key ? (
          <div className="flex flex-wrap items-center gap-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="flex items-center gap-1">
                <span className="text-slate-600">{f.label}</span>
                <NumberField
                  label={f.label}
                  value={key[f.key]}
                  min={f.min}
                  max={MAX_SIZE}
                  step={UNIT}
                  onChange={(v) => onChange(updateKey(keymap, selected!, { [f.key]: v }))}
                />
              </label>
            ))}
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={key.trackpad ?? false}
                onChange={(e) => onChange(updateKey(keymap, selected!, { trackpad: e.target.checked }))}
              />
              トラックパッド枠
            </label>
          </div>
        ) : (
          <p className="text-slate-400">キーボード上のキーをタップして選択してください</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON} onClick={add}>
            キーを追加
          </button>
          <button type="button" className={BUTTON} disabled={selected === null || keymap.layout.keys.length <= 1} onClick={remove}>
            選択中のキーを削除
          </button>
        </div>
        {overlaps.length > 0 && (
          <p className="text-xs text-red-600">
            重なっているキーがあります（赤く表示）。位置や大きさを調整してください。
          </p>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-slate-600">
          行・列（現在 {rows} 行 × {cols} 列、{keymap.layout.keys.length} キー）
        </h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={BUTTON} onClick={() => onChange(addRow(keymap))}>
            行を追加（下）
          </button>
          <button type="button" className={BUTTON} disabled={rows <= 1} onClick={() => onChange(removeLastRow(keymap), null)}>
            最下行を削除
          </button>
          <button type="button" className={BUTTON} onClick={() => onChange(addColumn(keymap))}>
            列を追加（右）
          </button>
          <button type="button" className={BUTTON} disabled={cols <= 1} onClick={() => onChange(removeLastColumn(keymap), null)}>
            右端の列を削除
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-slate-600">新規作成</h3>
        <div className="flex flex-wrap items-center gap-2">
          <NumberField label="行数" value={gridRows} min={1} max={MAX_SIZE} step={1} onChange={setGridRows} />
          <span>行 ×</span>
          <NumberField label="列数" value={gridCols} min={1} max={MAX_SIZE} step={1} onChange={setGridCols} />
          <span>列</span>
          <button type="button" className={BUTTON} onClick={create}>
            空のキー配列を作成
          </button>
        </div>
      </section>
    </div>
  )
}
