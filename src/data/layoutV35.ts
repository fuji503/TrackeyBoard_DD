import type { Direction } from '../features/gesture/types'

/**
 * キー配列 v3.5（Docs/KeyboardLayout/キー配列v3_5.html）の暫定定義。
 * フェーズ2で ZMK 風 JSON（types/keymap.ts）に置き換える。
 */
export interface KeyDef {
  id: string
  row: number
  col: number
  rowSpan?: number
  /** 方向ごとのラベル。center がタップ（太字）、他はフリック/グライド（小字） */
  labels: Partial<Record<Direction, string>>
  /** Apple 系 OS での入力（赤字） */
  mac?: string
  /** グライド入力にする方向。それ以外はフリック */
  glide?: Direction[]
  /** トラックパッドモード用の枠線意匠 */
  trackpad?: boolean
}

export const LAYOUT_COLS = 11
export const LAYOUT_ROWS = 4

type Spec = Omit<KeyDef, 'id' | 'row' | 'col'>

const k = (center: string, up?: string, down?: string, left?: string, right?: string): Spec => ({
  labels: { center, up, down, left, right },
})

const rows: Spec[][] = [
  [
    k('半角/全角', undefined, 'Esc'),
    k('Q', '(Win)', '1', 'F1', '!'),
    k('W', '(Mac)', '2', 'F2', '"'),
    k('E', '(And)', '3', 'F3', '#'),
    k('R', '(iOS)', '4', 'F4', '$'),
    k('T', undefined, '5', 'F5', '%'),
    k('Y', undefined, '6', 'F6', '&'),
    k('U', undefined, '7', 'F7', "'"),
    k('I', undefined, '8', 'F8', '-'),
    k('O', undefined, '9', 'F9', '~'),
    k('P', undefined, '0', 'F10'),
  ],
  [
    { ...k('Tab', '[Fn🌐]', 'Key/Pad'), trackpad: true },
    k('A', undefined, '@', 'F11', '`'),
    k('S', undefined, '¥', 'F12'),
    k('D', undefined, '^'),
    k('F', undefined, '*'),
    k('G', undefined, '('),
    k('H', undefined, ')'),
    k('J', 'Home', '[', '{', '}'),
    k('K', 'End', ']', '<', '>'),
    k('L', 'Insert', '|', undefined, '\\'),
    { ...k('Ent', 'Del', undefined, 'BS'), rowSpan: 2, glide: ['left'] },
  ],
  [
    k('Shift'),
    k('Z', undefined, '?', '\\'),
    k('X', undefined, '_'),
    k('C', undefined, '='),
    k('V', undefined, '+'),
    k('B', undefined, '/'),
    k('N', undefined, ';'),
    k('M', undefined, ':'),
    { ...k(',', '↑', '↓', '←', '→'), glide: ['up', 'down', 'left', 'right'] },
    k('.', 'PgUp', 'PgDn'),
    // 11列目は Ent が占有
  ],
  [
    k('Ctrl', '(OSsel)'),
    { ...k('Win'), mac: 'Opt' },
    { ...k('Alt'), mac: 'Cmd' },
    { ...k('無変換'), mac: '英数' },
    { ...k('Space'), trackpad: true },
    { ...k('Space'), trackpad: true },
    { ...k('Space'), trackpad: true },
    { ...k('変換'), mac: 'かな' },
    { ...k('Alt'), mac: 'Cmd' },
    k('Ctrl'),
    k('Shift'),
  ],
]

export const LAYOUT_V35: KeyDef[] = rows.flatMap((specs, row) =>
  specs.map((spec, col) => ({ ...spec, id: `r${row}c${col}`, row, col })),
)
