// Integration tests against the local Supabase stack.
//
// These exist because a mocked Supabase client cannot fail the way the real one
// does. Every NOT NULL violation, foreign key and RLS policy found on
// 2026-08-17 was invisible to unit tests — a mock happily accepts a row that
// Postgres rejects.
//
// Requires: npx supabase start
// Reset to a clean fixture with: npx supabase db reset

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { anonClient, signedInClient, stackIsRunning, SEED } from './helpers'

// Top-level await: this must resolve during collection, because whether a test
// is registered as skipped is decided then — beforeAll runs too late.
const running = await stackIsRunning()
if (!running) {
  console.warn(
    '\n  ⚠ Local Supabase stack is not running — integration tests skipped.' +
    '\n    Start it with: npx supabase start\n'
  )
}

const maybe = running ? it : it.skip

let db

beforeAll(async () => {
  if (running) db = await signedInClient()
})

describe('row level security', () => {
  maybe('denies reads to an anonymous client', async () => {
    const { data, error } = await anonClient().from('items').select('*')
    expect(error).toBeNull()
    expect(data).toEqual([]) // RLS filters rather than errors
  })

  maybe('denies writes to an anonymous client', async () => {
    const { error } = await anonClient()
      .from('categories').insert({ name: 'should-not-persist' })
    expect(error).not.toBeNull()
  })

  maybe('allows reads once signed in', async () => {
    const { data, error } = await db.from('items').select('id')
    expect(error).toBeNull()
    expect(data.length).toBeGreaterThan(0)
  })
})

describe('log constraints', () => {
  // REGRESSION: requester_id and checker_id are NOT NULL with no default.
  // Both the Buy More and Archive flows omitted them and failed in production.
  maybe('rejects a log row with no requester', async () => {
    const { error } = await db.from('log').insert({
      type: 'ADD', item_id: SEED.tent, qty: 1, unit: 'tents',
      checker_id: SEED.qm, event: 'no requester',
    })
    expect(error).not.toBeNull()
    expect(error.code).toBe('23502') // not_null_violation
    expect(error.message).toMatch(/requester_id/)
  })

  maybe('rejects a log row with no checker', async () => {
    const { error } = await db.from('log').insert({
      type: 'ADD', item_id: SEED.tent, qty: 1, unit: 'tents',
      requester_id: SEED.qm, event: 'no checker',
    })
    expect(error).not.toBeNull()
    expect(error.code).toBe('23502')
    expect(error.message).toMatch(/checker_id/)
  })

  maybe('rejects a requester that is not a real member', async () => {
    const { error } = await db.from('log').insert({
      type: 'ADD', item_id: SEED.tent, qty: 1, unit: 'tents',
      requester_id: '00000000-0000-4000-8000-00000000dead',
      checker_id: SEED.qm, event: 'bad fk',
    })
    expect(error).not.toBeNull()
    expect(error.code).toBe('23503') // foreign_key_violation
  })

  maybe('accepts a fully populated row', async () => {
    const { data, error } = await db.from('log').insert({
      type: 'ADD', item_id: SEED.tent, qty: 1, unit: 'tents',
      requester_id: SEED.qm, checker_id: SEED.qm,
      event: 'integration test', notes: 'safe to delete',
    }).select().single()

    expect(error).toBeNull()
    expect(data.requester_id).toBe(SEED.qm)

    await db.from('log').delete().eq('id', data.id)
  })
})

describe('items and their joins', () => {
  maybe('returns category and location names, as getItems expects', async () => {
    const { data, error } = await db
      .from('items')
      .select('*, categories(name), locations(name)')
      .eq('id', SEED.tent)
      .single()

    expect(error).toBeNull()
    expect(data.categories.name).toBe('Tentage')
    expect(data.locations.name).toBe('Shelf A — Tentage')
  })

  maybe('allows an item with no location', async () => {
    const { data, error } = await db
      .from('items').select('location_id').eq('id', SEED.lamp).single()
    expect(error).toBeNull()
    expect(data.location_id).toBeNull()
  })
})

describe('deleting a location', () => {
  // The FK is ON DELETE SET NULL: removing a location must not remove the gear
  // stored there.
  maybe('unassigns its items instead of deleting them', async () => {
    const { data: loc } = await db
      .from('locations').insert({ name: 'Temp Bay' }).select().single()

    const { data: item } = await db.from('items').insert({
      name: 'Temp Item', quantity: 1, total_owned: 1,
      unit: 'units', location_id: loc.id,
    }).select().single()

    await db.from('locations').delete().eq('id', loc.id)

    const { data: after } = await db
      .from('items').select('id, location_id').eq('id', item.id).single()

    expect(after).not.toBeNull()
    expect(after.location_id).toBeNull()

    await db.from('items').delete().eq('id', item.id)
  })

  maybe('refuses to delete a protected location', async () => {
    // deleteLocation() guards this in app code; confirm the flag is really set
    const { data } = await db
      .from('locations').select('protected').eq('name', 'Cage (locked)').single()
    expect(data.protected).toBe(true)
  })
})

describe('transactions', () => {
  maybe('exposes the seeded open checkout as unreturned', async () => {
    const { data, error } = await db
      .from('transactions').select('*').is('returned_at', null)
    expect(error).toBeNull()
    expect(data.map(t => t.id)).toContain(SEED.openTx)
  })

  maybe('records who returned an item when closed', async () => {
    const { data: tx } = await db.from('transactions').insert({
      item_id: SEED.tent, group_id: SEED.eaglePatrol, qty: 1,
      requester_id: SEED.scout, checkout_checker_id: SEED.qm,
      checked_out_at: new Date().toISOString(),
    }).select().single()

    // REGRESSION: these two columns are nullable, so the CheckIn key mismatch
    // wrote NULL here for months without ever raising an error.
    await db.from('transactions').update({
      returner_id: SEED.scout,
      return_checker_id: SEED.qm,
      condition: 'Good',
      returned_at: new Date().toISOString(),
    }).eq('id', tx.id)

    const { data: closed } = await db
      .from('transactions').select('*').eq('id', tx.id).single()

    expect(closed.returner_id).toBe(SEED.scout)
    expect(closed.return_checker_id).toBe(SEED.qm)

    await db.from('transactions').delete().eq('id', tx.id)
  })
})

afterAll(async () => {
  if (db) await db.auth.signOut()
})
