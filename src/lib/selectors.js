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

/** A location's rectangle, with defaults applied. */
export function sectionRect(location) {
  return {
    x: location.grid_x || 0,
    y: location.grid_y || 0,
    w: location.grid_w || 1,
    h: location.grid_h || 1,
  };
}

/** Do two grid rectangles share any cell? */
export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w &&
         a.y < b.y + b.h && b.y < a.y + a.h;
}

/**
 * Keep a rectangle inside the grid: at least one cell, never off the left or
 * top edge, never past the right-hand column.
 */
export function clampToGrid(rect, columns = GRID_COLUMNS) {
  const w = Math.max(1, Math.min(rect.w, columns));
  const h = Math.max(1, rect.h);
  return {
    w, h,
    x: Math.max(0, Math.min(rect.x, columns - w)),
    y: Math.max(0, rect.y),
  };
}

/**
 * Whether `rect` can be placed without landing on another section. The moving
 * section is excluded by id so it never collides with where it currently is.
 */
export function canPlaceSection(rect, locations, movingId, columns = GRID_COLUMNS) {
  const clamped = clampToGrid(rect, columns);
  if (clamped.x !== rect.x || clamped.y !== rect.y ||
      clamped.w !== rect.w || clamped.h !== rect.h) {
    return false;
  }
  return !locations
    .filter(l => l.id !== movingId)
    .some(l => rectsOverlap(rect, sectionRect(l)));
}

/**
 * Active members who may sign off on a storeroom action — the people the
 * "checked by" dropdowns offer.
 *
 * Derived from the roles table rather than a hardcoded list of role names. The
 * same `manages_inventory` flag drives can_manage_inventory() in Postgres, so
 * the dropdown cannot offer someone the database would then refuse.
 */
export function selectStoreroomCheckers(members, roles) {
  const allowed = new Set(
    roles.filter(r => r.manages_inventory).map(r => r.name)
  );
  return members.filter(m => m.active && allowed.has(m.role));
}

/** Items at or below the low-stock threshold. */
export function selectLowStock(items, threshold = 2) {
  return items.filter(i => !i.removed && i.quantity <= threshold);
}

/** Total units sitting in the storeroom. */
export function selectTotalUnits(items) {
  return items.filter(i => !i.removed).reduce((a, b) => a + b.quantity, 0);
}
