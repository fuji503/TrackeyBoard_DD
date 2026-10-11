import { useState } from 'react'
import {
  BM_KEY_PITCH_MM,
  CSS_PX_PER_MM,
  PITCH_RANGE_MM,
  calibrate,
  type KeyboardSize,
} from '../features/keyboardSize'
import SliderRow from './SliderRow'

interface Props {
  size: KeyboardSize
  /** 現在表示中のキーピッチ (px) */
  pitchPx: number
  onChange: (size: KeyboardSize) => void
}

const BUTTON = 'rounded border px-2 py-0.5'
const BUTTON_ON = 'border-blue-600 bg-blue-600 text-white'
const BUTTON_OFF = 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'

export default function KeyboardSizeSettings({ size, pitchPx, onChange }: Props) {
  const [measured, setMeasured] = useState('')
  const pitchMm = pitchPx / size.pxPerMm
  const calibrated = size.pxPerMm !== CSS_PX_PER_MM
  const isBmSize = size.mode === 'manual' && size.pitchMm === BM_KEY_PITCH_MM
  const measuredMm = Number(measured)

  const applyCalibration = () => {
    if (!(measuredMm > 0)) return
    onChange(calibrate(pitchPx, measuredMm))
    setMeasured('')
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="font-bold text-slate-600">キーボードサイズ</div>
      <SliderRow
        label="キーピッチ"
        value={Math.round(pitchMm * 10) / 10}
        {...PITCH_RANGE_MM}
        unit="mm"
        note={`(${Math.round(pitchPx)}px)`}
        onChange={(v) => onChange({ ...size, mode: 'manual', pitchMm: v })}
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className={`${BUTTON} ${size.mode === 'fit' ? BUTTON_ON : BUTTON_OFF}`}
          onClick={() => onChange({ ...size, mode: 'fit' })}
        >
          画面幅に合わせる
        </button>
        <button
          type="button"
          className={`${BUTTON} ${isBmSize ? BUTTON_ON : BUTTON_OFF}`}
          onClick={() => onChange({ ...size, mode: 'manual', pitchMm: BM_KEY_PITCH_MM })}
        >
          実機サイズ ({BM_KEY_PITCH_MM}mm)
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
        <span>実測補正: 画面上のキー1個の幅</span>
        <input
          type="number"
          inputMode="decimal"
          min="1"
          step="0.1"
          value={measured}
          onChange={(e) => setMeasured(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyCalibration()}
          className="w-16 rounded border border-slate-300 px-1 py-0.5 text-right font-mono"
          placeholder="mm"
        />
        <span>mm</span>
        <button
          type="button"
          disabled={!(measuredMm > 0)}
          className={`${BUTTON} ${BUTTON_OFF} disabled:opacity-40`}
          onClick={applyCalibration}
        >
          補正
        </button>
      </div>
      <p className="text-[11px] leading-snug text-slate-400">
        定規でキー1個の幅（枠線から枠線まで）を測って入力すると、{BM_KEY_PITCH_MM}mm が実寸になるよう補正します。
        {calibrated && (
          <>
            {' '}
            補正済み ({size.pxPerMm.toFixed(2)}px/mm)
            <button
              type="button"
              className="ml-1 text-blue-600 underline"
              onClick={() => onChange({ ...size, pxPerMm: CSS_PX_PER_MM })}
            >
              補正を解除
            </button>
          </>
        )}
      </p>
    </div>
  )
}
