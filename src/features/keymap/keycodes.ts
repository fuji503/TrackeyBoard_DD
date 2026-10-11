/**
 * HID キーコード表。
 * - name: キーマップ JSON で使う名前（ZMK の &kp の引数）。ZMK 標準名に揃え、
 *   JIS 配列ホストでの記号は zmk-keyboard-jp と同じく JP_ 接頭辞で定義する
 * - 記号の多くは「Shift + 基本キー」の組み合わせ（mods に LSHIFT）
 */

/** HID の修飾キービット（Keyboard page 0xE0〜0xE7 の順） */
export const MOD = {
  LCTRL: 1 << 0,
  LSHIFT: 1 << 1,
  LALT: 1 << 2,
  LGUI: 1 << 3,
  RCTRL: 1 << 4,
  RSHIFT: 1 << 5,
  RALT: 1 << 6,
  RGUI: 1 << 7,
} as const

export const SHIFT_MASK = MOD.LSHIFT | MOD.RSHIFT
/** これらが押されているとショートカット扱いになり、文字は入力されない */
export const SHORTCUT_MASK = MOD.LCTRL | MOD.LALT | MOD.LGUI | MOD.RCTRL | MOD.RALT | MOD.RGUI

export type UsagePage = 'keyboard' | 'consumer'

export interface Keycode {
  usage: number
  page: UsagePage
  mods: number
  /** キートップ表示。省略時は JIS ホストでの入力文字から作る */
  label?: string
}

/** QMK 形式の名前（履歴表示用）。Keyboard page の usage → 名前 */
const QMK_NAMES: Record<number, string> = {
  0x28: 'KC_ENT', 0x29: 'KC_ESC', 0x2a: 'KC_BSPC', 0x2b: 'KC_TAB', 0x2c: 'KC_SPC',
  0x2d: 'KC_MINS', 0x2e: 'KC_EQL', 0x2f: 'KC_LBRC', 0x30: 'KC_RBRC', 0x31: 'KC_BSLS',
  0x32: 'KC_NUHS', 0x33: 'KC_SCLN', 0x34: 'KC_QUOT', 0x35: 'KC_GRV', 0x36: 'KC_COMM',
  0x37: 'KC_DOT', 0x38: 'KC_SLSH', 0x39: 'KC_CAPS',
  0x49: 'KC_INS', 0x4a: 'KC_HOME', 0x4b: 'KC_PGUP', 0x4c: 'KC_DEL', 0x4d: 'KC_END',
  0x4e: 'KC_PGDN', 0x4f: 'KC_RGHT', 0x50: 'KC_LEFT', 0x51: 'KC_DOWN', 0x52: 'KC_UP',
  0x87: 'KC_INT1', 0x88: 'KC_INT2', 0x89: 'KC_INT3', 0x8a: 'KC_INT4', 0x8b: 'KC_INT5',
  0x90: 'KC_LNG1', 0x91: 'KC_LNG2',
  0xe0: 'KC_LCTL', 0xe1: 'KC_LSFT', 0xe2: 'KC_LALT', 0xe3: 'KC_LGUI',
  0xe4: 'KC_RCTL', 0xe5: 'KC_RSFT', 0xe6: 'KC_RALT', 0xe7: 'KC_RGUI',
}
for (let i = 0; i < 26; i++) QMK_NAMES[0x04 + i] = `KC_${String.fromCharCode(65 + i)}`
for (let i = 0; i < 10; i++) QMK_NAMES[0x1e + i] = `KC_${(i + 1) % 10}`
for (let i = 0; i < 12; i++) QMK_NAMES[0x3a + i] = `KC_F${i + 1}`

const MOD_NAMES = ['KC_LCTL', 'KC_LSFT', 'KC_LALT', 'KC_LGUI', 'KC_RCTL', 'KC_RSFT', 'KC_RALT', 'KC_RGUI']

export function isModifierUsage(kc: Keycode): boolean {
  return kc.page === 'keyboard' && kc.usage >= 0xe0 && kc.usage <= 0xe7
}

/** 修飾キー usage → ビット */
export function modBit(kc: Keycode): number {
  return isModifierUsage(kc) ? 1 << (kc.usage - 0xe0) : 0
}

/** 修飾ビット + キーを "KC_LSFT+KC_2" の形式にする */
export function formatHid(kc: Keycode, mods: number): string {
  const key =
    kc.page === 'consumer'
      ? `CONSUMER_0x${kc.usage.toString(16).toUpperCase().padStart(3, '0')}`
      : (QMK_NAMES[kc.usage] ?? `0x${kc.usage.toString(16)}`)
  const modNames = MOD_NAMES.filter((name, i) => mods & (1 << i) && name !== key)
  return [...modNames, key].join('+')
}

/** 修飾ビットだけを "KC_LCTL+KC_LSFT" の形式にする */
export function formatMods(mods: number): string {
  return MOD_NAMES.filter((_, i) => mods & (1 << i)).join('+')
}

export function formatUsage(kc: Keycode): string {
  return `0x${kc.usage.toString(16).toUpperCase().padStart(2, '0')}`
}

// ---- JIS 配列ホストでの入力文字 ---------------------------------------------

/** usage → [Shift なし, Shift あり] の入力文字 */
const JIS_CHARS: Record<number, [string, string?]> = {
  0x1e: ['1', '!'], 0x1f: ['2', '"'], 0x20: ['3', '#'], 0x21: ['4', '$'], 0x22: ['5', '%'],
  0x23: ['6', '&'], 0x24: ['7', "'"], 0x25: ['8', '('], 0x26: ['9', ')'], 0x27: ['0'],
  0x2c: [' ', ' '], 0x2d: ['-', '='], 0x2e: ['^', '~'], 0x2f: ['@', '`'], 0x30: ['[', '{'],
  0x32: [']', '}'], 0x33: [';', '+'], 0x34: [':', '*'], 0x36: [',', '<'], 0x37: ['.', '>'],
  0x38: ['/', '?'], 0x87: ['\\', '_'], 0x89: ['¥', '|'],
}
for (let i = 0; i < 26; i++) {
  const c = String.fromCharCode(97 + i)
  JIS_CHARS[0x04 + i] = [c, c.toUpperCase()]
}

/** JIS 配列ホストで入力される文字。文字を出さないキーは undefined */
export function jisChar(kc: Keycode, mods: number): string | undefined {
  if (kc.page !== 'keyboard') return undefined
  const chars = JIS_CHARS[kc.usage]
  return chars?.[mods & SHIFT_MASK ? 1 : 0]
}

// ---- キーコード名の定義 -----------------------------------------------------

const KEYCODES: Record<string, Keycode> = {}

function def(names: string | string[], usage: number, extra: Partial<Keycode> = {}) {
  for (const name of ([] as string[]).concat(names)) {
    KEYCODES[name] = { usage, page: 'keyboard', mods: 0, ...extra }
  }
}
const SHIFTED = { mods: MOD.LSHIFT }

for (let i = 0; i < 26; i++) def(String.fromCharCode(65 + i), 0x04 + i)
for (let i = 1; i <= 10; i++) def([`N${i % 10}`, `NUMBER_${i % 10}`], 0x1d + i)
for (let i = 1; i <= 12; i++) def(`F${i}`, 0x39 + i, { label: `F${i}` })

def(['RET', 'ENTER', 'RETURN'], 0x28, { label: 'Ent' })
def(['ESC', 'ESCAPE'], 0x29, { label: 'Esc' })
def(['BSPC', 'BACKSPACE'], 0x2a, { label: 'BS' })
def('TAB', 0x2b, { label: 'Tab' })
def(['SPACE', 'SPC'], 0x2c, { label: 'Space' })
def('CAPS', 0x39, { label: 'Caps' })
def(['INS', 'INSERT'], 0x49, { label: 'Insert' })
def('HOME', 0x4a, { label: 'Home' })
def(['PG_UP', 'PAGE_UP'], 0x4b, { label: 'PgUp' })
def(['DEL', 'DELETE'], 0x4c, { label: 'Del' })
def('END', 0x4d, { label: 'End' })
def(['PG_DN', 'PAGE_DOWN'], 0x4e, { label: 'PgDn' })
def(['RIGHT', 'RIGHT_ARROW'], 0x4f, { label: '→' })
def(['LEFT', 'LEFT_ARROW'], 0x50, { label: '←' })
def(['DOWN', 'DOWN_ARROW'], 0x51, { label: '↓' })
def(['UP', 'UP_ARROW'], 0x52, { label: '↑' })

def(['LCTRL', 'LEFT_CONTROL'], 0xe0, { label: 'Ctrl' })
def(['LSHFT', 'LSHIFT', 'LEFT_SHIFT'], 0xe1, { label: 'Shift' })
def(['LALT', 'LEFT_ALT'], 0xe2, { label: 'Alt' })
def(['LGUI', 'LEFT_GUI', 'LWIN', 'LCMD'], 0xe3, { label: 'Win' })
def(['RCTRL', 'RIGHT_CONTROL'], 0xe4, { label: 'Ctrl' })
def(['RSHFT', 'RSHIFT', 'RIGHT_SHIFT'], 0xe5, { label: 'Shift' })
def(['RALT', 'RIGHT_ALT'], 0xe6, { label: 'Alt' })
def(['RGUI', 'RIGHT_GUI', 'RWIN', 'RCMD'], 0xe7, { label: 'Win' })

// US/JIS 共通の記号
def(['MINUS'], 0x2d)
def(['SEMI', 'SEMICOLON'], 0x33)
def(['COMMA'], 0x36)
def(['DOT', 'PERIOD'], 0x37)
def(['FSLH', 'SLASH'], 0x38)
def(['EXCL', 'EXCLAMATION'], 0x1e, SHIFTED)
def(['HASH', 'POUND'], 0x20, SHIFTED)
def(['DLLR', 'DOLLAR'], 0x21, SHIFTED)
def(['PRCNT', 'PERCENT'], 0x22, SHIFTED)
def(['LT', 'LESS_THAN'], 0x36, SHIFTED)
def(['GT', 'GREATER_THAN'], 0x37, SHIFTED)
def(['QMARK', 'QUESTION'], 0x38, SHIFTED)

// JIS 配列ホスト用（US とキー位置が異なる記号・日本語キー）
def('JP_DQT', 0x1f, SHIFTED)
def('JP_AMPS', 0x23, SHIFTED)
def('JP_SQT', 0x24, SHIFTED)
def('JP_LPAR', 0x25, SHIFTED)
def('JP_RPAR', 0x26, SHIFTED)
def('JP_EQUAL', 0x2d, SHIFTED)
def('JP_CARET', 0x2e)
def('JP_TILDE', 0x2e, SHIFTED)
def('JP_AT', 0x2f)
def('JP_GRAVE', 0x2f, SHIFTED)
def('JP_LBKT', 0x30)
def('JP_LBRC', 0x30, SHIFTED)
def('JP_RBKT', 0x32)
def('JP_RBRC', 0x32, SHIFTED)
def('JP_PLUS', 0x33, SHIFTED)
def('JP_COLON', 0x34)
def('JP_ASTRK', 0x34, SHIFTED)
def('JP_BSLH', 0x87)
def('JP_UNDER', 0x87, SHIFTED)
def('JP_YEN', 0x89)
def('JP_PIPE', 0x89, SHIFTED)
def('JP_ZKHK', 0x35, { label: '半角/全角' })
def(['JP_HENK', 'INT4'], 0x8a, { label: '変換' })
def(['JP_MHEN', 'INT5'], 0x8b, { label: '無変換' })
def(['LANG1', 'JP_KANA'], 0x90, { label: 'かな' })
def(['LANG2', 'JP_EISU'], 0x91, { label: '英数' })

// Apple の Fn(🌐) キー（Consumer page: AC Next Keyboard Layout Select）
KEYCODES.GLOBE = { usage: 0x29d, page: 'consumer', mods: 0, label: 'Fn🌐' }

const MOD_FUNCS: Record<string, number> = {
  LS: MOD.LSHIFT, LC: MOD.LCTRL, LA: MOD.LALT, LG: MOD.LGUI,
  RS: MOD.RSHIFT, RC: MOD.RCTRL, RA: MOD.RALT, RG: MOD.RGUI,
}

/**
 * キーコード名を解決する。ZMK の修飾関数 LS(A), LC(LS(Z)) などにも対応。
 * 未知の名前は undefined
 */
export function lookupKeycode(name: string): Keycode | undefined {
  const m = /^([LR][SCAG])\((.+)\)$/.exec(name.trim())
  if (m) {
    const inner = lookupKeycode(m[2])
    return inner && { ...inner, mods: inner.mods | MOD_FUNCS[m[1]], label: undefined }
  }
  return KEYCODES[name.trim()]
}

/** キートップ表示用ラベル */
export function keycodeLabel(kc: Keycode): string | undefined {
  if (kc.label) return kc.label
  const c = jisChar(kc, kc.mods)
  // 英字はキートップ同様に大文字で表示
  return c && /^[a-z]$/.test(c) ? c.toUpperCase() : c
}
