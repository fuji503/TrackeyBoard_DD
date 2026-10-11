import type { MouseButton } from '../keymap/binding'

/**
 * ポインタ入力（トラックパッド / トラックポイント）の出力。
 * HID マウスレポート相当で、移動・スクロールは小数のまま積算して使う
 */
export type PointerOutput =
  /** カーソル移動 (px) */
  | { type: 'move'; dx: number; dy: number }
  /** スクロール（ホイール段。dy > 0 で下へスクロール = 内容が上へ動く） */
  | { type: 'scroll'; dx: number; dy: number }
  /** ボタンの押下 / 解放（Space キーのボタン） */
  | { type: 'button'; button: MouseButton; pressed: boolean }
  /** クリック（押してすぐ離す。タップ等） */
  | { type: 'click'; button: MouseButton }
  /** 1回のなぞりの終わり（履歴のまとめ単位） */
  | { type: 'strokeEnd' }
  /** トラックパッドモードからキーボードモードへ戻る（Tab の下フリック） */
  | { type: 'exitTrackpad' }
  /** トラックポイントモードに入る / 出る */
  | { type: 'trackpoint'; active: boolean }
