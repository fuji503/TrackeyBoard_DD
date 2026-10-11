/** キーボードエディタのキーコード一覧（タブごと） */
export interface PaletteGroup {
  title: string
  /** 修飾キー（Shift 等）を付けられるか（&kp のみ） */
  modifiable: boolean
  bindings: string[]
}

const kp = (names: string[]) => names.map((n) => `&kp ${n}`)
const range = (n: number, f: (i: number) => string) => Array.from({ length: n }, (_, i) => f(i))

export const PALETTE: PaletteGroup[] = [
  {
    title: '文字・数字',
    modifiable: true,
    bindings: kp([...range(26, (i) => String.fromCharCode(65 + i)), ...range(10, (i) => `N${(i + 1) % 10}`)]),
  },
  {
    title: '記号 (JIS)',
    modifiable: true,
    bindings: kp([
      'EXCL', 'JP_DQT', 'HASH', 'DLLR', 'PRCNT', 'JP_AMPS', 'JP_SQT', 'JP_LPAR', 'JP_RPAR',
      'MINUS', 'JP_EQUAL', 'JP_CARET', 'JP_TILDE', 'JP_YEN', 'JP_PIPE',
      'JP_AT', 'JP_GRAVE', 'JP_LBKT', 'JP_LBRC', 'JP_RBKT', 'JP_RBRC',
      'SEMI', 'JP_PLUS', 'JP_COLON', 'JP_ASTRK',
      'COMMA', 'LT', 'DOT', 'GT', 'FSLH', 'QMARK', 'JP_BSLH', 'JP_UNDER',
    ]),
  },
  {
    title: '編集・移動',
    modifiable: true,
    bindings: kp([
      'ESC', 'TAB', 'SPACE', 'RET', 'BSPC', 'DEL', 'INS', 'CAPS',
      'UP', 'DOWN', 'LEFT', 'RIGHT', 'HOME', 'END', 'PG_UP', 'PG_DN',
      ...range(12, (i) => `F${i + 1}`),
    ]),
  },
  {
    title: '修飾・日本語',
    modifiable: false,
    bindings: kp([
      'LSHFT', 'LCTRL', 'LALT', 'LGUI', 'RSHFT', 'RCTRL', 'RALT', 'RGUI',
      'JP_ZKHK', 'JP_MHEN', 'JP_HENK', 'LANG2', 'LANG1', 'GLOBE',
    ]),
  },
  {
    title: '特殊',
    modifiable: false,
    bindings: [
      '&none', '&trans', '&os_sel', '&os_set WIN', '&os_set MAC', '&os_set ANDROID', '&os_set IOS', '&tp_toggle',
    ],
  },
]

/** 特殊ビヘイビアの説明（ボタンのツールチップ・表示用） */
export const BEHAVIOR_HELP: Record<string, string> = {
  '&none': '何もしない（下位レイヤーも使わない）',
  '&trans': '下位レイヤーの設定を使う',
  '&os_sel': 'OS 切替待機モードへ',
  '&os_set WIN': 'OS を Win/Linux に（OS 切替待機レイヤー用）',
  '&os_set MAC': 'OS を Mac に（OS 切替待機レイヤー用）',
  '&os_set ANDROID': 'OS を Android に（OS 切替待機レイヤー用）',
  '&os_set IOS': 'OS を iOS に（OS 切替待機レイヤー用）',
  '&tp_toggle': 'トラックパッドモード切替',
}

export const MODIFIER_WRAPPERS = [
  { fn: 'LS', label: 'Shift' },
  { fn: 'LC', label: 'Ctrl' },
  { fn: 'LA', label: 'Alt' },
  { fn: 'LG', label: 'GUI' },
] as const

/** "&kp A" に修飾関数を付けて "&kp LC(LS(A))" にする */
export function wrapModifiers(binding: string, fns: string[]): string {
  const m = /^&kp\s+(.+)$/.exec(binding)
  if (!m || fns.length === 0) return binding
  return `&kp ${fns.reduceRight((inner, fn) => `${fn}(${inner})`, m[1])}`
}
