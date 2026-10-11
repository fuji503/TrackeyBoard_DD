export interface TouchMark {
  x: number
  y: number
  kind: 'finger' | 'button' | 'stick'
  /** stick のとき: ずらし量の基準点 */
  originX?: number
  originY?: number
}

/**
 * 指の位置の表示用ストア。指が動くたびにキーボード全体を再描画しないよう、
 * オーバーレイだけが購読する
 */
export class TouchStore {
  private marks = new Map<number, TouchMark>()
  private snapshot: TouchMark[] = []
  private listeners = new Set<() => void>()

  set(id: number, mark: TouchMark) {
    this.marks.set(id, mark)
    this.publish()
  }

  delete(id: number) {
    if (this.marks.delete(id)) this.publish()
  }

  clear() {
    if (this.marks.size === 0) return
    this.marks.clear()
    this.publish()
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  private publish() {
    this.snapshot = [...this.marks.values()]
    this.listeners.forEach((l) => l())
  }
}
