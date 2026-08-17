// Pure derivations of view state from loaded data.
// Extracted from App.jsx so they can be tested without rendering anything.

/**
 * Items to show in the Inventory tab, after the archived toggle, the search
 * box and the category filter.
 */
export function selectDisplayItems(items, { search = '', filterCat = 'All', showRemoved = false } = {}) {
  const pool = items.filter(i => (showRemoved ? i.removed : !i.removed));
  const s = search.toLowerCase();
  return pool.filter(i => {
    const matchesSearch =
      (i.name || '').toLowerCase().includes(s) ||
      (i.category || '').toLowerCase().includes(s);
    // Compare on category_id, not the display name. `<option value>` is always
    // a string while category_id may be numeric, so coerce both sides.
    const matchesCat =
      filterCat === 'All' || String(i.category_id) === String(filterCat);
    return matchesSearch && matchesCat;
  });
}

/**
 * Groups with their outstanding checkouts derived from open transactions,
 * rather than tracked separately in state (which did not survive a reload).
 */
export function selectGroupsWithCheckouts(groups, transactions, items) {
  return groups.map(g => ({
    ...g,
    checkouts: transactions
      .filter(t => t.group_id === g.id && t.returned_at === null)
      .map(t => {
        const item = items.find(i => i.id === t.item_id);
        return {
          itemId: t.item_id,
          itemName: item?.name || 'Unknown item',
          unit: item?.unit || '',
          qty: t.qty,
          date: t.checked_out_at,
          event: t.event,
        };
      }),
  }));
}

/** Logical width of the storeroom map, in grid cells. */
export const GRID_COLUMNS = 6;

/**
 * Rows needed to contain every location, so the room grows downward rather
 * than clipping anything placed below the visible area. Also used to park a
 * newly added location on a fresh row, where it cannot overlap.
 */
export function gridRows(locations) {
  return locations.reduce(
    (max, l) => Math.max(max, (l.grid_y || 0) + (l.grid_h || 1)),
    0
  );
}

/** Items at or below the low-stock threshold. */
export function selectLowStock(items, threshold = 2) {
  return items.filter(i => !i.removed && i.quantity <= threshold);
}

/** Total units sitting in the storeroom. */
export function selectTotalUnits(items) {
  return items.filter(i => !i.removed).reduce((a, b) => a + b.quantity, 0);
}
