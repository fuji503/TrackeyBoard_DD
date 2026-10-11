import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { parseKeymap } from '../features/keymap/binding'
import { renderKeymapPng } from '../features/keymap/renderImage'
import { keymapFileName, serializeKeymap } from '../features/keymap/serialize'
import { useAppState } from '../state/appState'
import { downloadBlob } from '../utils/download'

type Message = { type: 'ok' | 'error'; text: string } | null

const BUTTON =
  'w-full rounded border border-slate-300 bg-slate-100 px-4 py-3 text-slate-800 hover:bg-slate-200 active:bg-slate-300 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-slate-100'

export default function ExportImportScreen() {
  const { keymap, setKeymap, gesture, resetKeymap, importKeymap, exportKeymap } = useAppState()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<Message>(null)
  const fileName = keymapFileName(keymap.name)

  const downloadJson = () => {
    const blob = new Blob([serializeKeymap(exportKeymap())], { type: 'application/json' })
    downloadBlob(blob, fileName)
    setMessage({ type: 'ok', text: `${fileName} をダウンロードしました` })
  }

  const upload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 同じファイルを続けて選んでも反応するように
    if (!file) return
    try {
      let data: unknown
      try {
        data = JSON.parse(await file.text())
      } catch {
        throw new Error('JSON として読み込めませんでした')
      }
      const km = parseKeymap(data)
      importKeymap(km)
      const withSettings = km.settings?.gesture ? '（ジェスチャー設定も反映しました）' : '（ジェスチャー設定は含まれていません）'
      setMessage({ type: 'ok', text: `「${km.name}」を読み込みました${withSettings}` })
    } catch (err) {
      setMessage({ type: 'error', text: `${file.name}: ${(err as Error).message}` })
    }
  }

  const downloadImage = async () => {
    try {
      const png = fileName.replace(/\.json$/, '.png')
      downloadBlob(await renderKeymapPng(keymap), png)
      setMessage({ type: 'ok', text: `${png} をダウンロードしました` })
    } catch (err) {
      setMessage({ type: 'error', text: (err as Error).message })
    }
  }

  const reset = () => {
    if (!window.confirm('キーマップを既定（BM 配列 v3.5）に戻します。編集内容は失われます。よろしいですか？')) return
    resetKeymap()
    setMessage({ type: 'ok', text: 'キーマップを既定に戻しました' })
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-6">
      <Row hint={`ダウンロードするファイル名: ${fileName}`}>
        <label className="flex items-center gap-3">
          <span className="shrink-0 text-sm font-bold text-slate-600">キーマップ名</span>
          <input
            type="text"
            value={keymap.name}
            onChange={(e) => setKeymap({ ...keymap, name: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2"
            placeholder="キーマップ名"
          />
        </label>
      </Row>

      <Row
        hint={`キー配列・キーマップに加え、ジェスチャー設定（ホールド判定 ${gesture.holdDelay}ms / 連続入力間隔 ${gesture.repeatInterval}ms / フリック距離 ${gesture.flickThreshold}キー / グライド幅 ${gesture.glideStep}キー）を含みます`}
      >
        <button type="button" className={BUTTON} onClick={downloadJson}>
          キーマップ JSON ダウンロード
        </button>
      </Row>

      <Row hint="ジェスチャー設定が含まれていれば設定コンソールにも反映します">
        <button type="button" className={BUTTON} onClick={() => fileRef.current?.click()}>
          キーマップ JSON アップロード
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={upload} />
      </Row>

      <Row>
        <button type="button" className={BUTTON} onClick={downloadImage}>
          キーマップ画像ダウンロード
        </button>
      </Row>

      <Row>
        <button type="button" className={BUTTON} disabled>
          ファームウェアダウンロード（未定）
        </button>
      </Row>

      {message && (
        <p
          role="status"
          className={`rounded px-3 py-2 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}
        >
          {message.text}
        </p>
      )}

      <div className="mt-4 border-t border-slate-200 pt-4 text-right">
        <button type="button" className="text-sm text-slate-500 underline hover:text-slate-700" onClick={reset}>
          キーマップを既定（BM 配列 v3.5）に戻す
        </button>
      </div>
    </div>
  )
}

function Row({ hint, children }: { hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
