// ZMK 風のキー配列・キーマップ型定義（フェーズ2で詳細化）

/** 物理レイアウト上の1キー（単位は 1u = 標準キー幅） */
export interface PhysicalKey {
  x: number
  y: number
  w: number
  h: number
}

/** キーバインディング（ZMK の &kp KC_A などに相当） */
export interface Binding {
  behavior: string
  params: string[]
}

export interface Layer {
  name: string
  bindings: Binding[]
}

export interface Keymap {
  name: string
  layout: PhysicalKey[]
  layers: Layer[]
}
