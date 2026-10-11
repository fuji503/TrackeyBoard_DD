import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { GestureRecognizer } from '../features/gesture/GestureRecognizer'
import type { GestureConfig, GestureEvent } from '../features/gesture/types'
import { BM_KEY_PITCH_MM } from '../features/keyboardSize'
import { modeLayer, parseBinding, type MouseButton } from '../features/keymap/binding'
import { buildKeyViews, buildLayerKeyViews, keyAt, layoutBounds, nearestKey } from '../features/keymap/view'
import { stickSpeed, type PointerConfig } from '../features/pointer/config'
import type { PointerOutput } from '../features/pointer/output'
import { TouchStore } from '../features/pointer/touchStore'
import { TrackpadRecognizer, type PadTouchKind } from '../features/pointer/TrackpadRecognizer'
import { VtpSession } from '../features/pointer/VtpSession'
import { usePreventTouchDefaults } from '../hooks/usePreventTouchDefaults'
import type { InputMode, Keymap, PointerMode } from '../types/keymap'
import KeyButton from './KeyButton'
import KeyCap from './KeyCap'
import TouchOverlay from './TouchOverlay'

/** 外枠の上・左の線幅（各キーは右・下の線を持つ） */
export const KEYBOARD_BORDER_PX = 2

interface Props {
  keymap: Keymap
  config: GestureConfig
  pointer: PointerConfig
  mode: InputMode
  /** キーピッチ (px) */
  pitchPx: number
  onGesture: (keyIndex: number, event: GestureEvent) => void
  onPointer: (out: PointerOutput) => void
}

/** 指1本ごとの担当 */
type Controller =
  | { type: 'vtp'; session: VtpSession; keyIndex: number; start: { x: number; y: number }; handoff?: GestureRecognizer }
  | { type: 'pad' }
  | { type: 'tpButton'; button: MouseButton }
  | { type: 'ignored' }

/** トラックポイント中の中ボタン（ThinkPad 方式: 押したまま動かすとスクロール、動かさず離すと中クリック） */
interface StickState {
  session: VtpSession
  middleHeld: boolean
  middleUsed: boolean
}

/**
 * キーボード。モードによって入力の扱いが変わる
 * - keyboard:   各キーでジェスチャー入力。VTP の範囲で触り始めた指は VtpSession が扱う
 * - trackpad:   全体がパッド面（mode レイヤーの &mkp キーはボタン、&tp_toggle のキーは戻る操作）
 * - trackpoint: VTP の指でカーソル操作。mode レイヤーの &mkp キーだけ押せる
 */
export default function Keyboard({ keymap, config, pointer, mode, pitchPx, onGesture, onPointer }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  usePreventTouchDefaults(ref)
  const { cols, rows } = layoutBounds(keymap)
  const mmPerPx = BM_KEY_PITCH_MM / pitchPx

  const views = useMemo(() => {
    if (mode === 'keyboard') return buildKeyViews(keymap)
    const layer = modeLayer(keymap, mode)
    return layer ? buildLayerKeyViews(keymap, keymap.layers.indexOf(layer)) : buildKeyViews(keymap).map((v) => ({ ...v, legends: {} }))
  }, [keymap, mode])

  // イベントハンドラから最新の値を参照する
  const latest = useRef({ keymap, config, pointer, mmPerPx, pitchPx, onGesture, onPointer, views })
  useLayoutEffect(() => {
    latest.current = { keymap, config, pointer, mmPerPx, pitchPx, onGesture, onPointer, views }
  })

  const controllers = useRef(new Map<number, Controller>())
  /** 表示中の指の種類（移動中も色を保つ） */
  const markKinds = useRef(new Map<number, 'finger' | 'button'>())
  const touches = useMemo(() => new TouchStore(), [])
  const stick = useRef<StickState | null>(null)
  const [stickActive, setStickActive] = useState(false)

  // トラックパッドの認識器はモードに入るたびに作り直す
  const trackpadRef = useRef<TrackpadRecognizer | null>(null)
  useEffect(() => {
    if (mode !== 'trackpad') return
    const r = new TrackpadRecognizer({
      config: pointer,
      mmPerPx,
      toggleThresholdPx: config.flickThreshold * pitchPx,
      emit: (out) => latest.current.onPointer(out),
    })
    trackpadRef.current = r
    return () => {
      r.cancelAll()
      trackpadRef.current = null
    }
  }, [mode, pointer, mmPerPx, config.flickThreshold, pitchPx])

  // モードが変わったら、引き継げない指の表示を消す
  useEffect(() => {
    if (mode !== 'trackpoint') {
      for (const [id, c] of controllers.current) if (c.type !== 'vtp') controllers.current.delete(id)
    }
    if (mode === 'trackpad') touches.clear()
  }, [mode, touches])

  // ---- トラックポイントのカーソル移動（毎フレーム、ずらし量に応じた速度で動かす） ----
  useEffect(() => {
    if (!stickActive) return
    let last = performance.now()
    let raf = requestAnimationFrame(function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = stick.current
      const disp = s?.session.displacement()
      if (s && disp) {
        const { pointer: cfg, mmPerPx: mpp, onPointer: emit } = latest.current
        const len = Math.hypot(disp.x, disp.y)
        const speed = stickSpeed(len * mpp, cfg)
        if (speed > 0 && len > 0) {
          const ux = disp.x / len
          const uy = disp.y / len
          if (s.middleHeld) {
            const notches = cfg.stickScrollSpeed * (speed / cfg.stickMaxSpeed) * dt
            emit({ type: 'scroll', dx: ux * notches, dy: uy * notches })
            s.middleUsed = true
          } else {
            emit({ type: 'move', dx: ux * speed * dt, dy: uy * speed * dt })
          }
        }
      }
      raf = requestAnimationFrame(frame)
    })
    return () => cancelAnimationFrame(raf)
  }, [stickActive])

  /** クライアント座標 → キーボード内の px */
  const local = (e: PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left - KEYBOARD_BORDER_PX, y: e.clientY - rect.top - KEYBOARD_BORDER_PX }
  }

  /** mode レイヤーでのキーの役割 */
  const padKind = (m: PointerMode, keyIndex: number | null): PadTouchKind => {
    const kb = keyIndex === null ? undefined : modeLayer(keymap, m)?.bindings[keyIndex]
    if (!kb) return { kind: 'surface' }
    const center = kb.center ? parseBinding(kb.center) : undefined
    if (center?.type === 'mkp') return { kind: 'button', button: center.button }
    if ((['up', 'down', 'left', 'right'] as const).some((d) => kb[d] && parseBinding(kb[d]!).type === 'tp_toggle')) {
      return { kind: 'toggle' }
    }
    return { kind: 'surface' }
  }

  // ---- キーボードモード: VTP の範囲で触り始めた指を横取りする ----
  const handleDownCapture = (e: PointerEvent<HTMLDivElement>) => {
    const vtp = keymap.layout.vtp
    if (mode !== 'keyboard' || !vtp) return
    const p = local(e)
    const radiusPx = pointer.vtpRadiusMm / mmPerPx
    if (Math.hypot(p.x - vtp.x * pitchPx, p.y - vtp.y * pitchPx) > radiusPx) return
    e.stopPropagation()
    e.preventDefault()
    ref.current!.setPointerCapture(e.pointerId)
    const keyIndex = nearestKey(keymap, p.x / pitchPx, p.y / pitchPx) ?? 0
    const id = e.pointerId
    const session: VtpSession = new VtpSession({
      config: pointer,
      mmPerPx,
      emit: (ev) => {
        const { onPointer: emit, onGesture: gesture, views: vs, pitchPx: pitch, config: gcfg } = latest.current
        const ctl = controllers.current.get(id)
        switch (ev.type) {
          case 'enter':
            stick.current = { session, middleHeld: false, middleUsed: false }
            setStickActive(true)
            emit({ type: 'trackpoint', active: true })
            break
          case 'exit':
            // 押したままのボタンは離す
            for (const [otherId, c] of controllers.current) {
              if (c.type === 'tpButton') {
                if (c.button !== 'middle') emit({ type: 'button', button: c.button, pressed: false })
                controllers.current.set(otherId, { type: 'ignored' })
              }
            }
            stick.current = null
            setStickActive(false)
            touches.clear()
            emit({ type: 'strokeEnd' })
            emit({ type: 'trackpoint', active: false })
            break
          case 'keyTap':
            gesture(keyIndex, { kind: 'tap', direction: 'center' })
            break
          case 'handOff':
            if (ctl?.type === 'vtp') {
              // 下のキーのジェスチャー認識に引き継ぐ（触り始めの位置から再生する）
              const r = new GestureRecognizer({
                keySize: pitch,
                glideDirections: vs[keyIndex]?.glide ?? [],
                config: gcfg,
                onEvent: (gev) => latest.current.onGesture(keyIndex, gev),
              })
              r.down(ctl.start.x, ctl.start.y)
              ctl.handoff = r
            }
            break
        }
      },
    })
    controllers.current.set(id, { type: 'vtp', session, keyIndex, start: p })
    session.down(p.x, p.y)
  }

  // ---- トラックパッド / トラックポイント: キーボード全体で受ける ----
  const handleDown = (e: PointerEvent<HTMLDivElement>) => {
    if (mode === 'keyboard') return
    e.preventDefault()
    ref.current!.setPointerCapture(e.pointerId)
    const p = local(e)
    const keyIndex = keyAt(keymap, p.x / pitchPx, p.y / pitchPx)
    const kind = padKind(mode, keyIndex)

    const trackpad = trackpadRef.current
    if (mode === 'trackpad' && trackpad) {
      controllers.current.set(e.pointerId, { type: 'pad' })
      trackpad.down(e.pointerId, p.x, p.y, e.timeStamp, kind)
      const markKind = kind.kind === 'button' ? 'button' : 'finger'
      markKinds.current.set(e.pointerId, markKind)
      touches.set(e.pointerId, { ...p, kind: markKind })
      return
    }
    // トラックポイント中は mode レイヤーのボタンだけ押せる
    if (kind.kind !== 'button') {
      controllers.current.set(e.pointerId, { type: 'ignored' })
      return
    }
    controllers.current.set(e.pointerId, { type: 'tpButton', button: kind.button })
    touches.set(e.pointerId, { ...p, kind: 'button' })
    if (kind.button === 'middle' && stick.current) {
      stick.current.middleHeld = true
      stick.current.middleUsed = false
    } else {
      onPointer({ type: 'button', button: kind.button, pressed: true })
    }
  }

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    const ctl = controllers.current.get(e.pointerId)
    if (!ctl) return
    const p = local(e)
    switch (ctl.type) {
      case 'vtp':
        if (ctl.handoff) ctl.handoff.move(p.x, p.y)
        else ctl.session.move(p.x, p.y)
        if (ctl.session.phase === 'active') {
          const o = ctl.session.originPoint
          touches.set(e.pointerId, { ...p, kind: 'stick', originX: o.x, originY: o.y })
        }
        break
      case 'pad':
        trackpadRef.current?.move(e.pointerId, p.x, p.y, e.timeStamp)
        touches.set(e.pointerId, { ...p, kind: markKinds.current.get(e.pointerId) ?? 'finger' })
        break
    }
  }

  const finish = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const ctl = controllers.current.get(e.pointerId)
    if (!ctl) return
    controllers.current.delete(e.pointerId)
    touches.delete(e.pointerId)
    markKinds.current.delete(e.pointerId)
    switch (ctl.type) {
      case 'vtp':
        if (ctl.handoff) {
          if (cancelled) ctl.handoff.cancel()
          else ctl.handoff.up()
        }
        if (cancelled) ctl.session.cancel()
        else ctl.session.up()
        break
      case 'pad':
        if (cancelled) trackpadRef.current?.cancel(e.pointerId)
        else trackpadRef.current?.up(e.pointerId, e.timeStamp)
        break
      case 'tpButton':
        if (ctl.button === 'middle' && stick.current) {
          if (!stick.current.middleUsed && !cancelled) onPointer({ type: 'click', button: 'middle' })
          stick.current.middleHeld = false
          onPointer({ type: 'strokeEnd' })
        } else if (ctl.button !== 'middle') {
          onPointer({ type: 'button', button: ctl.button, pressed: false })
        }
        break
    }
  }

  const vtp = keymap.layout.vtp
  const radiusPx = pointer.vtpRadiusMm / mmPerPx

  return (
    <div
      ref={ref}
      className="relative box-content shrink-0 touch-none border-t-2 border-l-2 border-slate-400 select-none [-webkit-touch-callout:none]"
      style={{ '--pitch': `${pitchPx}px`, width: cols * pitchPx, height: rows * pitchPx } as CSSProperties}
      onPointerDownCapture={handleDownCapture}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
      onLostPointerCapture={(e) => finish(e, true)}
    >
      {views.map((view) =>
        mode === 'keyboard' ? (
          <KeyButton key={view.index} view={view} config={config} onGesture={onGesture} />
        ) : (
          <KeyCap
            key={view.index}
            view={view}
            data-key-index={view.index}
            background={
              padKind(mode, view.index).kind === 'surface'
                ? mode === 'trackpad'
                  ? 'bg-orange-50'
                  : 'bg-slate-100 opacity-60'
                : 'bg-white'
            }
          />
        ),
      )}
      {vtp && (
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: vtp.x * pitchPx, top: vtp.y * pitchPx }}
          aria-hidden
        >
          {mode === 'keyboard' && (
            <div
              className="absolute rounded-full border border-dashed border-red-400/60"
              style={{ width: radiusPx * 2, height: radiusPx * 2, left: -radiusPx, top: -radiusPx }}
            />
          )}
          <div
            className={`absolute rounded-full ${mode === 'trackpoint' ? 'bg-red-600 ring-4 ring-red-300' : 'bg-red-500'}`}
            style={{ width: pitchPx * 0.16, height: pitchPx * 0.16, left: -pitchPx * 0.08, top: -pitchPx * 0.08 }}
          />
        </div>
      )}
      <TouchOverlay store={touches} pitchPx={pitchPx} />
    </div>
  )
}
