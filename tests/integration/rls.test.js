// Row-level security, exercised against a real Postgres.
//
// This is the only place these rules can be tested. RLS is enforced by the
// database, so a mocked client proves nothing — and the failure mode is silent:
// a permissive policy left in place next to a strict one reads as locked down
// and enforces nothing, while every unit test still passes.
//
// Before this suite existed, a stranger who signed up with any email address
// could read every member's name and email, zero out the inventory, and delete
// the entire audit log.

import { describe, it, expect, beforeAll } from 'vitest'
import {
  clientFor, strangerClient, stackIsRunning, LOGINS, SEED,
} from './helpers'

const running = await stackIsRunning()
if (!running) {
  console.warn('\n  Supabase stack not reachable — skipping RLS tests.')
  console.warn('  Start it with `npx supabase start`.\n')
}
const maybe = running ? it : it.skip
const maybeDescribe = running ? describe : describe.skip

let stranger, scout, qm, leader, inactive

beforeAll(async () => {
  if (!running) return
  ;[stranger, scout, qm, leader, inactive] = await Promise.all([
    strangerClient(),
    clientFor(LOGINS.scout),
    clientFor(LOGINS.quartermaster),
    clientFor(LOGINS.leader),
    clientFor(LOGINS.inactive),
  ])
})

/** Rows a write actually touched. RLS denies silently — 200 with nothing changed. */
async function rowsChanged(query) {
  const { data } = await query.select()
  return data?.length ?? 0
}

maybeDescribe('someone with an account but no member row', () => {
  maybe('cannot read the inventory', async () => {
    const { data } = await stranger.from('items').select('name')
    expect(data).toEqual([])
  })

  // The most sensitive table in the app: names and emails of minors.
  maybe('cannot read member names or emails', async () => {
    const { data } = await stranger.from('members').select('full_name, email')
    expect(data).toEqual([])
  })

  maybe('cannot read the log', async () => {
    const { data } = await stranger.from('log').select('id')
    expect(data).toEqual([])
  })

  maybe('cannot change stock levels', async () => {
    expect(await rowsChanged(
      stranger.from('items').update({ quantity: 0 }).eq('id', SEED.tent)
    )).toBe(0)
  })

  maybe('cannot add an item', async () => {
    const { error } = await stranger
      .from('items').insert({ name: 'Smuggled', quantity: 1, unit: 'x' })
    expect(error).not.toBeNull()
  })
})

maybeDescribe('a member who has left the troop', () => {
  // Seeded as a quartermaster with active = false. Role alone must not be
  // enough, or someone who has left keeps their access until the auth user is
  // deleted by hand.
  maybe('is refused despite still holding a quartermaster role', async () => {
    const { data } = await inactive.from('items').select('name')
    expect(data).toEqual([])
  })

  maybe('cannot change stock levels', async () => {
    expect(await rowsChanged(
      inactive.from('items').update({ quantity: 0 }).eq('id', SEED.tent)
    )).toBe(0)
  })
})

maybeDescribe('a scout', () => {
  maybe('can read the inventory', async () => {
    const { data } = await scout.from('items').select('name')
    expect(data.length).toBeGreaterThan(0)
  })

  maybe('cannot change stock levels', async () => {
    expect(await rowsChanged(
      scout.from('items').update({ quantity: 99 }).eq('id', SEED.tent)
    )).toBe(0)
  })

  maybe('cannot add an item', async () => {
    const { error } = await scout
      .from('items').insert({ name: 'Nope', quantity: 1, unit: 'x' })
    expect(error).not.toBeNull()
  })

  maybe('cannot promote themselves', async () => {
    expect(await rowsChanged(
      scout.from('members').update({ role: 'troop_leader' }).eq('id', SEED.scout)
    )).toBe(0)
  })
})

maybeDescribe('a quartermaster', () => {
  maybe('can adjust stock', async () => {
    const { data } = await qm
      .from('items').update({ quantity: 5 }).eq('id', SEED.tent).select()
    expect(data).toHaveLength(1)
  })

  maybe('can append to the log', async () => {
    const { error } = await qm.from('log').insert({
      type: 'buymore', item_id: SEED.tent, qty: 1, unit: 'tents',
      requester_id: SEED.qm, checker_id: SEED.qm,
    })
    expect(error).toBeNull()
  })

  // Running the storeroom must not carry the power to promote yourself out
  // of it.
  maybe('cannot change anyone\'s role', async () => {
    expect(await rowsChanged(
      qm.from('members').update({ role: 'troop_leader' }).eq('id', SEED.scout)
    )).toBe(0)
  })

  maybe('cannot add a member', async () => {
    const { error } = await qm.from('members').insert({
      full_name: 'Sneaky', email: 'sneaky@troop.test', role: 'quartermaster',
    })
    expect(error).not.toBeNull()
  })
})

maybeDescribe('a troop leader', () => {
  maybe('can change a role', async () => {
    const { data } = await leader
      .from('members').update({ role: 'assistant_qm' }).eq('id', SEED.scout).select()
    expect(data).toHaveLength(1)
    // put it back
    await leader.from('members').update({ role: 'scout' }).eq('id', SEED.scout)
  })

  maybe('can add a member', async () => {
    const { data, error } = await leader.from('members').insert({
      full_name: 'New Scout', email: `new-${Date.now()}@troop.test`, role: 'scout',
    }).select()
    expect(error).toBeNull()
    await leader.from('members').delete().eq('id', data[0].id)
  })

  maybe('cannot invent a role outside the vocabulary', async () => {
    const { error } = await leader
      .from('members').update({ role: 'supreme_commander' }).eq('id', SEED.scout)
    expect(error).not.toBeNull()
    expect(error.message).toMatch(/members_role_valid|violates check constraint/i)
  })
})

maybeDescribe('the ledger is append-only', () => {
  // No UPDATE and no DELETE policy exists on `log`, for anybody. A record that
  // the most senior person present can quietly edit is not evidence.
  maybe('a quartermaster cannot delete log entries', async () => {
    const { data: before } = await qm.from('log').select('id')
    await qm.from('log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { data: after } = await qm.from('log').select('id')
    expect(after.length).toBe(before.length)
  })

  maybe('a troop leader cannot delete log entries either', async () => {
    const { data: before } = await leader.from('log').select('id')
    await leader.from('log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    const { data: after } = await leader.from('log').select('id')
    expect(after.length).toBe(before.length)
  })

  maybe('nobody can rewrite an existing entry', async () => {
    const { data: rows } = await leader.from('log').select('id, notes').limit(1)
    expect(rows.length).toBe(1)
    expect(await rowsChanged(
      leader.from('log').update({ notes: 'history, revised' }).eq('id', rows[0].id)
    )).toBe(0)
  })
})

maybeDescribe('the role predicates', () => {
  // NULL is not false. current_member_role() is NULL for a non-member, and
  // `NULL in (...)` is NULL — which RLS treats as deny, but PL/pgSQL does not:
  // `if not NULL` never fires, which would skip the escalation guard for
  // exactly the callers least entitled to bypass it.
  maybe('return false, never null, for someone with no member row', async () => {
    const { data } = await stranger.rpc('can_manage_members')
    expect(data).toBe(false)
  })

  maybe('report no role for someone with no member row', async () => {
    const { data } = await stranger.rpc('current_member_role')
    expect(data).toBeNull()
  })

  maybe('identify a quartermaster', async () => {
    const { data } = await qm.rpc('current_member_role')
    expect(data).toBe('quartermaster')
  })

  maybe('deny member management to a quartermaster', async () => {
    const { data } = await qm.rpc('can_manage_members')
    expect(data).toBe(false)
  })

  maybe('grant member management to a leader', async () => {
    const { data } = await leader.rpc('can_manage_members')
    expect(data).toBe(true)
  })

  maybe('report no role for an inactive member', async () => {
    const { data } = await inactive.rpc('current_member_role')
    expect(data).toBeNull()
  })
})
