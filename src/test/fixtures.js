// Shared fixtures mirroring the shape the app receives from Supabase.
// Ids match supabase/seed.sql so unit and integration tests read alike.

export const QM = {
  id: 'b0000000-0000-4000-8000-000000000001',
  full_name: 'Alex Tan', email: 'qm@troop.test',
  role: 'quartermaster', active: true,
}
export const ASSISTANT_QM = {
  id: 'b0000000-0000-4000-8000-000000000002',
  full_name: 'Priya Nair', email: 'priya@troop.test',
  role: 'assistant_qm', active: true,
}
export const SCOUT = {
  id: 'b0000000-0000-4000-8000-000000000004',
  full_name: 'Jordan Wong', email: 'jordan@troop.test',
  role: 'scout', active: true,
}
export const members = [QM, ASSISTANT_QM, SCOUT]

// Mirrors public.roles. `manages_inventory` is the same flag
// can_manage_inventory() reads in Postgres, so what the dropdowns offer and
// what the database accepts come from one place.
export const roles = [
  { name: 'troop_leader',     label: 'Troop Leader',            sort_order: 1, manages_inventory: true,  manages_members: true },
  { name: 'assistant_leader', label: 'Assistant Troop Leader',  sort_order: 2, manages_inventory: true,  manages_members: true },
  { name: 'scouter',          label: 'Scouter',                 sort_order: 3, manages_inventory: true,  manages_members: true },
  { name: 'quartermaster',    label: 'Quartermaster',           sort_order: 4, manages_inventory: true,  manages_members: false },
  { name: 'assistant_qm',     label: 'Assistant Quartermaster', sort_order: 5, manages_inventory: true,  manages_members: false },
  { name: 'committee_member', label: 'Committee Member',        sort_order: 6, manages_inventory: false, manages_members: false },
  { name: 'scout',            label: 'Scout',                   sort_order: 7, manages_inventory: false, manages_members: false },
]

/** The members a "checked by" dropdown may offer. */
export const checkers = [QM, ASSISTANT_QM]

export const TENTAGE = { id: 'c0000000-0000-4000-8000-000000000001', name: 'Tentage' }
export const COOKING = { id: 'c0000000-0000-4000-8000-000000000002', name: 'Cooking' }
export const categories = [TENTAGE, COOKING]

export const locations = [
  { id: 'a1000000-0000-4000-8000-000000000001', name: 'Shelf A — Tentage',
    grid_x: 0, grid_y: 0, grid_w: 2, grid_h: 1 },
  { id: 'a1000000-0000-4000-8000-000000000002', name: 'Shelf B — Cooking',
    grid_x: 2, grid_y: 0, grid_w: 2, grid_h: 1 },
]

export const tent = {
  id: 'd0000000-0000-4000-8000-000000000001',
  name: '4-Man Tent', category_id: TENTAGE.id, category: 'Tentage',
  location_id: locations[0].id, location: 'Shelf A — Tentage',
  quantity: 6, total_owned: 8, unit: 'tents', removed: false, notes: null,
}
export const stove = {
  id: 'd0000000-0000-4000-8000-000000000003',
  name: 'Trangia Stove', category_id: COOKING.id, category: 'Cooking',
  location_id: locations[1].id, location: 'Shelf B — Cooking',
  quantity: 2, total_owned: 5, unit: 'sets', removed: false, notes: null,
}
export const archivedLamp = {
  id: 'd0000000-0000-4000-8000-000000000007',
  name: 'Kerosene Lamp', category_id: COOKING.id, category: 'Cooking',
  location_id: null, location: null,
  quantity: 0, total_owned: 0, unit: 'lamps', removed: true, notes: null,
}
export const items = [tent, stove, archivedLamp]

export const eaglePatrol = {
  id: 'e0000000-0000-4000-8000-000000000001',
  name: 'Eagle Patrol', type: 'led', members: [],
}
export const kitchenCrew = {
  id: 'e0000000-0000-4000-8000-000000000002',
  name: 'Kitchen Crew', type: 'collective', members: [],
}
export const groups = [eaglePatrol, kitchenCrew]

export const openCheckout = {
  id: 'f0000000-0000-4000-8000-000000000001',
  item_id: tent.id, group_id: eaglePatrol.id, qty: 2,
  requester_id: SCOUT.id, checkout_checker_id: QM.id,
  event: 'District Camp', checkout_remarks: null,
  checked_out_at: '2026-08-11T00:00:00Z', returned_at: null,
}
export const closedCheckout = {
  ...openCheckout,
  id: 'f0000000-0000-4000-8000-000000000002',
  returned_at: '2026-08-13T00:00:00Z',
}
