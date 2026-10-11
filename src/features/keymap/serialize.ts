import type { Keymap } from '../../types/keymap'

const one = (v: unknown) => JSON.stringify(v)

function array(items: unknown[], indent: string): string {
  if (items.length === 0) return '[]'
  return `[\n${items.map((i) => indent + one(i)).join(',\n')}\n${indent.slice(2)}]`
}

/**
 * キーマップを JSON 文字列にする。キー・バインディングは1件1行にして、
 * 人が読んだり差分を見たりしやすくする
 */
export function serializeKeymap(km: Keymap): string {
  const layers = km.layers
    .map(
      (l) =>
        `    {\n      "name": ${one(l.name)},\n      "activation": ${one(l.activation)},\n      "bindings": ${array(l.bindings, '        ')}\n    }`,
    )
    .join(',\n')
  const lines = [
    `  "format": ${one(km.format)}`,
    `  "version": ${one(km.version)}`,
    `  "name": ${one(km.name)}`,
    ...(km.settings ? [`  "settings": ${one(km.settings)}`] : []),
    `  "layout": {\n    "keys": ${array(km.layout.keys, '      ')}\n  }`,
    `  "layers": [\n${layers}\n  ]`,
  ]
  return `{\n${lines.join(',\n')}\n}\n`
}

/** ファイル名に使えない文字を除いてファイル名を作る */
export function keymapFileName(name: string): string {
  // 制御文字もファイル名に使えないので意図的に含める
  // oxlint-disable-next-line no-control-regex
  const base = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim().replace(/\.json$/i, '')
  return `${base || 'keymap'}.json`
}
