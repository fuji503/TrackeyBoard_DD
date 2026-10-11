import { describe, expect, it } from 'vitest'
import { DEFAULT_KEYMAP } from '.'
import { createGrid } from '../../features/keymap/edit'
import { migrateKeymap } from './migrate'

const withoutModes = (km = DEFAULT_KEYMAP) => ({
  ...km,
  layout: { keys: km.layout.keys },
  layers: km.layers.filter((l) => l.activation.type !== 'mode'),
})

describe('migrateKeymap', () => {
  it('v3.5 配列ならモードレイヤーと VTP を既定から補う', () => {
    expect(migrateKeymap(withoutModes())).toEqual(DEFAULT_KEYMAP)
  })

  it('別の配列なら空のモードレイヤーを足し、VTP は付けない', () => {
    const grid = withoutModes(createGrid(DEFAULT_KEYMAP, 2, 2))
    const migrated = migrateKeymap(grid)
    expect(migrated.layers.filter((l) => l.activation.type === 'mode')).toHaveLength(2)
    expect(migrated.layers.at(-1)?.bindings).toHaveLength(4)
    expect(migrated.layout.vtp).toBeUndefined()
  })

  it('既に新しい形式なら何もしない', () => {
    expect(migrateKeymap(DEFAULT_KEYMAP)).toBe(DEFAULT_KEYMAP)
  })
})
