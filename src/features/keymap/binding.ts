import type { Direction } from '../gesture/types'
import { KEYMAP_FORMAT, OS_LABELS, type Keymap, type Layer, type OsId } from '../../types/keymap'
import { keycodeLabel, lookupKeycode, type Keycode } from './keycodes'

/**
 * 解析済みバインディング。対応するビヘイビア:
 * - &kp <keycode>        キー入力
 * - &none / &trans       何もしない / 下位レイヤーへ透過
 * - &os_sel              OS 切替待機モードへ（TrackeyBoard 固有）
 * - &os_set <WIN|MAC|ANDROID|IOS>  OS 切替（OS 切替待機レイヤー用）
 * - &tp_toggle           トラックパッドモード切替（TrackeyBoard 固有・未実装）
 */
export type Behavior =
  | { type: 'kp'; keycode: Keycode }
  | { type: 'none' }
  | { type: 'trans' }
  | { type: 'os_sel' }
  | { type: 'os_set'; os: OsId }
  | { type: 'tp_toggle' }

const OS_PARAMS: Record<string, OsId> = { WIN: 'win', MAC: 'mac', ANDROID: 'android', IOS: 'ios' }

export function parseBinding(binding: string): Behavior {
  const [name, ...params] = binding.trim().split(/\s+/)
  switch (name) {
    case '&kp': {
      const keycode = lookupKeycode(params.join(' '))
      if (!keycode) throw new Error(`未知のキーコード: ${binding}`)
      return { type: 'kp', keycode }
    }
    case '&none':
      return { type: 'none' }
    case '&trans':
      return { type: 'trans' }
    case '&os_sel':
      return { type: 'os_sel' }
    case '&os_set': {
      const os = OS_PARAMS[params[0]]
      if (!os) throw new Error(`未知の OS: ${binding}`)
      return { type: 'os_set', os }
    }
    case '&tp_toggle':
      return { type: 'tp_toggle' }
  }
  throw new Error(`未知のビヘイビア: ${binding}`)
}

export function behaviorLabel(b: Behavior): string | undefined {
  switch (b.type) {
    case 'kp':
      return keycodeLabel(b.keycode)
    case 'os_sel':
      return '(OSsel)'
    case 'os_set':
      return `(${OS_LABELS[b.os]})`
    case 'tp_toggle':
      return 'Key/Pad'
  }
  return undefined
}

/** OS とモードから、上位→下位の順に有効なレイヤーを返す */
export function activeLayers(keymap: Keymap, os: OsId, osSelect: boolean): Layer[] {
  if (osSelect) return keymap.layers.filter((l) => l.activation.type === 'os_select')
  return keymap.layers
    .filter((l) => l.activation.type === 'always' || (l.activation.type === 'os' && l.activation.os.includes(os)))
    .reverse()
}

/** 有効レイヤーを上から探してバインディング文字列を決める */
export function resolveBinding(layers: Layer[], keyIndex: number, dir: Direction): string {
  for (const layer of layers) {
    const b = layer.bindings[keyIndex]?.[dir]
    if (b !== undefined && b.trim() !== '&trans') return b
  }
  return '&none'
}

/**
 * JSON から読み込んだ値を検証して Keymap として返す。不正なら理由付きで例外を投げる
 * （フェーズ3のインポートでも使う）
 */
export function parseKeymap(data: unknown): Keymap {
  const fail = (msg: string): never => {
    throw new Error(`キーマップが不正です: ${msg}`)
  }
  if (typeof data !== 'object' || data === null) fail('オブジェクトではありません')
  const km = data as Keymap
  if (km.format !== KEYMAP_FORMAT) fail(`format が "${KEYMAP_FORMAT}" ではありません`)
  if (km.version !== 1) fail(`未対応の version です: ${km.version}`)
  if (typeof km.name !== 'string') fail('name がありません')
  const gesture = km.settings?.gesture
  if (gesture !== undefined) {
    if (typeof gesture !== 'object' || gesture === null) fail('settings.gesture がオブジェクトではありません')
    for (const [key, v] of Object.entries(gesture)) {
      if (typeof v !== 'number' || !Number.isFinite(v)) fail(`settings.gesture.${key} が数値ではありません`)
    }
  }
  if (!Array.isArray(km.layout?.keys)) fail('layout.keys がありません')
  km.layout.keys.forEach((k, i) => {
    if (![k.x, k.y, k.w, k.h].every((v) => typeof v === 'number' && Number.isFinite(v))) {
      fail(`layout.keys[${i}] の x, y, w, h が数値ではありません`)
    }
  })
  if (!Array.isArray(km.layers) || km.layers.length === 0) fail('layers がありません')
  km.layers.forEach((layer, li) => {
    if (!Array.isArray(layer.bindings)) fail(`layers[${li}].bindings がありません`)
    if (layer.bindings.length !== km.layout.keys.length) {
      fail(`layers[${li}] のキー数 (${layer.bindings.length}) が layout と一致しません (${km.layout.keys.length})`)
    }
    layer.bindings.forEach((kb, ki) => {
      for (const dir of ['center', 'up', 'down', 'left', 'right'] as const) {
        const b = kb?.[dir]
        if (b === undefined) continue
        try {
          parseBinding(b)
        } catch (e) {
          fail(`layers[${li}] "${layer.name}" のキー ${ki} (${dir}): ${(e as Error).message}`)
        }
      }
    })
  })
  return km
}
