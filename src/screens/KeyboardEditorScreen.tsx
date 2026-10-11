import { useMemo, useState } from 'react'
import DirectionPad from '../components/editor/DirectionPad'
import EditorKeyboard from '../components/editor/EditorKeyboard'
import KeycodePalette from '../components/editor/KeycodePalette'
import LayoutEditor from '../components/editor/LayoutEditor'
import SlotEditor from '../components/editor/SlotEditor'
import type { Direction } from '../features/gesture/types'
import { findOverlaps, setBinding, setLegend } from '../features/keymap/edit'
import { buildLayerKeyViews, layoutBounds } from '../features/keymap/view'
import { useElementWidth } from '../hooks/useElementWidth'
import { useAppState } from '../state/appState'
import { MODE_LABELS, OS_LABELS, type Keymap, type Layer } from '../types/keymap'

const MAX_HISTORY = 100
const MAX_PITCH = 64
const MIN_PITCH = 24

function layerDescription(layer: Layer): string {
  switch (layer.activation.type) {
    case 'always':
      return '常に有効'
    case 'os':
      return layer.activation.os.map((os) => OS_LABELS[os]).join(' / ')
    case 'os_select':
      return 'OS切替待機中'
    case 'mode':
      return `${MODE_LABELS[layer.activation.mode]}モード`
  }
}

type Tab = 'keycode' | 'layout'

export default function KeyboardEditorScreen() {
  const { keymap, setKeymap } = useAppState()
  const [layerIndex, setLayerIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(0)
  const [dir, setDir] = useState<Direction>('center')
  const [tab, setTab] = useState<Tab>('keycode')
  const [areaRef, areaWidth] = useElementWidth()
  // 元に戻す / やり直す（この画面を開いている間だけ保持）
  const [history, setHistory] = useState<{ past: Keymap[]; future: Keymap[] }>({ past: [], future: [] })

  const layer = keymap.layers[layerIndex] ?? keymap.layers[0]
  const views = useMemo(() => buildLayerKeyViews(keymap, layerIndex), [keymap, layerIndex])
  const overlaps = useMemo(() => findOverlaps(keymap), [keymap])
  const overlapping = useMemo(() => new Set(overlaps.flat()), [overlaps])
  const { cols, rows } = layoutBounds(keymap)
  const pitchPx = Math.max(MIN_PITCH, Math.min(MAX_PITCH, (areaWidth - 2) / cols))
  const selectedIndex = selected !== null && selected < keymap.layout.keys.length ? selected : null
  const selectedView = selectedIndex !== null ? views[selectedIndex] : undefined
  const baseLayer = keymap.layers.find((l) => l.activation.type === 'always')

  const commit = (next: Keymap, select?: number | null) => {
    setHistory((h) => ({ past: [...h.past, keymap].slice(-MAX_HISTORY), future: [] }))
    setKeymap(next)
    if (select !== undefined) setSelected(select)
  }

  const undo = () => {
    const prev = history.past.at(-1)
    if (!prev) return
    setHistory({ past: history.past.slice(0, -1), future: [...history.future, keymap] })
    setKeymap(prev)
  }

  const redo = () => {
    const next = history.future.at(-1)
    if (!next) return
    setHistory({ past: [...history.past, keymap], future: history.future.slice(0, -1) })
    setKeymap(next)
  }

  const currentBinding = selectedIndex !== null ? layer.bindings[selectedIndex]?.[dir] : undefined

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 text-sm">
          <span className="mr-1 text-xs font-bold text-slate-600">編集するレイヤー</span>
          {keymap.layers.map((l, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setLayerIndex(i)}
              className={`rounded border px-2 py-1 ${
                i === layerIndex
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {l.name}
              <span className={`ml-1 text-[10px] ${i === layerIndex ? 'text-blue-100' : 'text-slate-400'}`}>
                {layerDescription(l)}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            disabled={history.past.length === 0}
            onClick={undo}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm hover:bg-slate-100 disabled:opacity-40"
          >
            ↶ 元に戻す
          </button>
          <button
            type="button"
            disabled={history.future.length === 0}
            onClick={redo}
            className="rounded border border-slate-300 bg-white px-2 py-1 text-sm hover:bg-slate-100 disabled:opacity-40"
          >
            ↷ やり直す
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div ref={areaRef} className="min-w-0 flex-1 overflow-x-auto">
          <EditorKeyboard
            views={views}
            cols={cols}
            rows={rows}
            pitchPx={pitchPx}
            selected={selectedIndex}
            selectedDir={dir}
            overlapping={overlapping}
            vtp={keymap.layout.vtp}
            onSelect={setSelected}
          />
          <p className="mt-1 text-xs text-slate-400">
            キーをタップして選択。{layer.activation.type === 'os' && '薄い文字はベースレイヤーの設定がそのまま使われる方向です。'}
            {layer.activation.type === 'os_select' &&
              'このレイヤーは OS 切替待機中だけ有効で、ここに無いキーに触れると切替をキャンセルします。'}
          </p>
        </div>

        {selectedView && selectedIndex !== null && (
          <div className="flex shrink-0 flex-col gap-3 rounded border border-slate-300 bg-white p-3 lg:w-80">
            <div className="text-xs text-slate-500">
              選択中: キー {selectedIndex}（{selectedView.legends.center ?? '—'}）
            </div>
            <DirectionPad
              view={selectedView}
              selected={dir}
              glide={baseLayer?.bindings[selectedIndex]?.glide ?? []}
              onSelect={setDir}
            />
            <SlotEditor
              key={`${layerIndex}-${selectedIndex}-${dir}-${currentBinding ?? ''}-${layer.bindings[selectedIndex]?.legend?.[dir] ?? ''}`}
              keymap={keymap}
              layerIndex={layerIndex}
              keyIndex={selectedIndex}
              dir={dir}
              onChange={commit}
            />
          </div>
        )}
      </div>

      <div className="rounded border border-slate-300 bg-white p-3">
        <div className="mb-3 flex gap-1 border-b border-slate-200">
          {(
            [
              ['keycode', 'キーコード割り当て'],
              ['layout', 'キー配列の編集'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 text-sm ${
                id === tab ? 'border-b-2 border-blue-600 font-bold text-blue-700' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === 'keycode' ? (
          selectedIndex !== null ? (
            <KeycodePalette
              current={currentBinding}
              // 割り当て直したら、その方向の印字の上書きは解除して新しいキーの表示にする
              onPick={(b) => commit(setLegend(setBinding(keymap, layerIndex, selectedIndex, dir, b), layerIndex, selectedIndex, dir))}
            />
          ) : (
            <p className="text-sm text-slate-400">キーボード上のキーをタップして選択してください</p>
          )
        ) : (
          <LayoutEditor keymap={keymap} selected={selectedIndex} overlaps={overlaps} onChange={commit} />
        )}
      </div>
    </div>
  )
}
