import type { HidLogItem } from '../keymap/engine'
import type { MouseButton } from '../keymap/binding'
import type { PointerOutput } from './output'

/** HID マウスのボタン番号 */
const BUTTON_NO: Record<MouseButton, number> = { left: 1, right: 2, middle: 3 }

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`)

/**
 * ポインタ出力を HID 履歴用にまとめる。
 * 移動・スクロールは毎回記録すると履歴が埋まるので、なぞり1回分を積算して1件にする
 */
export class MouseLogAggregator {
  private move = { dx: 0, dy: 0 }
  private scroll = { dx: 0, dy: 0 }

  add(out: PointerOutput): HidLogItem[] {
    switch (out.type) {
      case 'move':
        this.move.dx += out.dx
        this.move.dy += out.dy
        return []
      case 'scroll':
        this.scroll.dx += out.dx
        this.scroll.dy += out.dy
        return []
      case 'button':
        return [
          ...this.flush(),
          {
            action: 'mouse',
            binding: '',
            hid: `BTN${BUTTON_NO[out.button]}`,
            note: out.pressed ? '押下' : '解放',
          },
        ]
      case 'click':
        return [...this.flush(), { action: 'mouse', binding: '', hid: `BTN${BUTTON_NO[out.button]}`, note: 'クリック' }]
      default:
        return this.flush()
    }
  }

  /** 積算中の移動・スクロールを記録として出す */
  flush(): HidLogItem[] {
    const items: HidLogItem[] = []
    const mx = Math.round(this.move.dx)
    const my = Math.round(this.move.dy)
    if (mx || my) items.push({ action: 'mouse', binding: '', hid: `MOUSE dx=${signed(mx)} dy=${signed(my)}` })
    // HID のホイールは上方向が正
    const wv = Math.round(-this.scroll.dy)
    const wh = Math.round(this.scroll.dx)
    if (wv || wh) items.push({ action: 'mouse', binding: '', hid: `WHEEL v=${signed(wv)} h=${signed(wh)}` })
    this.move = { dx: 0, dy: 0 }
    this.scroll = { dx: 0, dy: 0 }
    return items
  }
}
