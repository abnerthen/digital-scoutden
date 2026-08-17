import { describe, it, expect } from 'vitest'
import {
  selectDisplayItems,
  selectGroupsWithCheckouts,
  selectLowStock,
  selectTotalUnits,
} from './selectors'
import {
  items, tent, archivedLamp,
  groups, eaglePatrol, kitchenCrew,
  openCheckout, closedCheckout,
  TENTAGE, COOKING,
} from '../test/fixtures'

describe('selectDisplayItems', () => {
  it('shows active items and hides archived ones by default', () => {
    const result = selectDisplayItems(items)
    expect(result.map(i => i.name)).toEqual(['4-Man Tent', 'Trangia Stove'])
  })

  it('shows only archived items when the toggle is on', () => {
    const result = selectDisplayItems(items, { showRemoved: true })
    expect(result.map(i => i.name)).toEqual(['Kerosene Lamp'])
  })

  // REGRESSION: this filter used to compare the category *name* against the
  // dropdown value, which is a category id — so picking any category returned
  // an empty list.
  it('filters by category id, not category name', () => {
    const result = selectDisplayItems(items, { filterCat: TENTAGE.id })
    expect(result.map(i => i.name)).toEqual(['4-Man Tent'])
  })

  it('returns nothing for a category with no active items', () => {
    const result = selectDisplayItems([tent], { filterCat: COOKING.id })
    expect(result).toEqual([])
  })

  // REGRESSION: <option value> hands back a string even when the id is
  // numeric, so a strict === on mismatched types silently matched nothing.
  it('matches ids across string and number types', () => {
    const numeric = [{ ...tent, category_id: 7 }]
    expect(selectDisplayItems(numeric, { filterCat: '7' })).toHaveLength(1)
    expect(selectDisplayItems(numeric, { filterCat: 7 })).toHaveLength(1)
  })

  it('searches on item name, case-insensitively', () => {
    expect(selectDisplayItems(items, { search: 'trangia' })).toHaveLength(1)
    expect(selectDisplayItems(items, { search: 'TENT' }).map(i => i.name))
      .toEqual(['4-Man Tent'])
  })

  it('searches on category name too', () => {
    expect(selectDisplayItems(items, { search: 'cooking' }).map(i => i.name))
      .toEqual(['Trangia Stove'])
  })

  it('applies search and category filter together', () => {
    const result = selectDisplayItems(items, { search: 'stove', filterCat: TENTAGE.id })
    expect(result).toEqual([])
  })

  it('tolerates items with missing name or category', () => {
    const partial = [{ id: 'x', quantity: 1, removed: false }]
    expect(() => selectDisplayItems(partial, { search: 'any' })).not.toThrow()
  })
})

describe('selectGroupsWithCheckouts', () => {
  // REGRESSION: checkouts used to be patched into group state on check-out and
  // hardcoded to [] on load, so they vanished on refresh. They are now derived.
  it('derives outstanding checkouts from open transactions', () => {
    const result = selectGroupsWithCheckouts(groups, [openCheckout], items)
    const eagle = result.find(g => g.id === eaglePatrol.id)
    expect(eagle.checkouts).toEqual([
      expect.objectContaining({
        itemId: tent.id, itemName: '4-Man Tent', unit: 'tents',
        qty: 2, event: 'District Camp',
      }),
    ])
  })

  it('ignores transactions that have been returned', () => {
    const result = selectGroupsWithCheckouts(groups, [closedCheckout], items)
    expect(result.every(g => g.checkouts.length === 0)).toBe(true)
  })

  it('gives groups with nothing out an empty list, not undefined', () => {
    const result = selectGroupsWithCheckouts(groups, [openCheckout], items)
    const kitchen = result.find(g => g.id === kitchenCrew.id)
    expect(kitchen.checkouts).toEqual([])
  })

  it('preserves the original group fields', () => {
    const [first] = selectGroupsWithCheckouts(groups, [], items)
    expect(first).toMatchObject({ id: eaglePatrol.id, name: 'Eagle Patrol', type: 'led' })
  })

  it('falls back gracefully when the item is missing', () => {
    const orphan = { ...openCheckout, item_id: 'gone' }
    const [eagle] = selectGroupsWithCheckouts([eaglePatrol], [orphan], items)
    expect(eagle.checkouts[0]).toMatchObject({ itemName: 'Unknown item', unit: '' })
  })
})

describe('selectLowStock', () => {
  it('includes items at or below the threshold', () => {
    expect(selectLowStock(items).map(i => i.name)).toEqual(['Trangia Stove'])
  })

  it('excludes archived items even at zero quantity', () => {
    expect(selectLowStock([archivedLamp])).toEqual([])
  })

  it('honours a custom threshold', () => {
    expect(selectLowStock(items, 6).map(i => i.name))
      .toEqual(['4-Man Tent', 'Trangia Stove'])
  })
})

describe('selectTotalUnits', () => {
  it('sums in-store quantity of active items only', () => {
    // tent 6 + stove 2; the archived lamp is excluded
    expect(selectTotalUnits(items)).toBe(8)
  })

  it('is zero for an empty inventory', () => {
    expect(selectTotalUnits([])).toBe(0)
  })
})
