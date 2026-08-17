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

  // The vocabulary lives in public.roles; members.role is a foreign key to it.
  maybe('cannot invent a role outside the vocabulary', async () => {
    const { error } = await leader
      .from('members').update({ role: 'supreme_commander' }).eq('id', SEED.scout)
    expect(error).not.toBeNull()
    expect(error.message).toMatch(/members_role_fkey|foreign key constraint/i)
  })
})

maybeDescribe('the roles table', () => {
  maybe('is readable by the troop', async () => {
    const { data } = await scout.from('roles').select('name, label')
    expect(data.length).toBe(7)
  })

  // ⚠️ The whole point. These rows are policy, not data: if a leader could set
  // manages_members on 'scout', every privilege guard in this schema would be
  // pointless — the escalation would just move one table across.
  maybe('cannot be edited by a troop leader', async () => {
    const { data } = await leader
      .from('roles').update({ manages_members: true }).eq('name', 'scout').select()
    expect(data ?? []).toHaveLength(0)

    const { data: after } = await leader
      .from('roles').select('manages_members').eq('name', 'scout').single()
    expect(after.manages_members).toBe(false)
  })

  maybe('cannot have a new role added by a troop leader', async () => {
    const { error } = await leader.from('roles').insert({
      name: 'supreme_commander', label: 'Supreme Commander',
      sort_order: 99, manages_inventory: true, manages_members: true,
    })
    expect(error).not.toBeNull()
  })

  maybe('cannot be deleted by a troop leader', async () => {
    await leader.from('roles').delete().eq('name', 'scout')
    const { data } = await leader.from('roles').select('name').eq('name', 'scout')
    expect(data).toHaveLength(1)
  })

  // A role in use must not vanish from under the members holding it.
  maybe('keeps roles that members still hold', async () => {
    const { data } = await leader.from('roles').select('name, manages_inventory, manages_members')
    const byName = Object.fromEntries(data.map(r => [r.name, r]))
    expect(byName.quartermaster).toMatchObject({ manages_inventory: true, manages_members: false })
    expect(byName.troop_leader).toMatchObject({ manages_inventory: true, manages_members: true })
    expect(byName.scout).toMatchObject({ manages_inventory: false, manages_members: false })
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

// members and auth.users are separate tables by necessity — most Scouts never
// sign in. These keep the join between them honest.
maybeDescribe('the member/account link', () => {
  maybe('reports who has a login and who does not', async () => {
    const { data, error } = await leader.rpc('account_link_report')
    expect(error).toBeNull()
    const states = new Set(data.map(r => r.state))
    expect(states.has('linked')).toBe(true)
    expect(states.has('no login')).toBe(true)
  })

  // The account list is not roster data; it should not be readable by the
  // storeroom team, let alone the troop at large.
  maybe('is not readable by a quartermaster', async () => {
    const { error } = await qm.rpc('account_link_report')
    expect(error).not.toBeNull()
  })

  maybe('is not readable by a scout', async () => {
    const { error } = await scout.rpc('account_link_report')
    expect(error).not.toBeNull()
  })

  maybe('refuses a link to an account that does not exist', async () => {
    const { error } = await leader
      .from('members')
      .update({ auth_user_id: '99999999-9999-4999-8999-999999999999' })
      .eq('id', SEED.scout)
    expect(error).not.toBeNull()
    expect(error.message).toMatch(/foreign key|members_auth_user_id_fkey/i)
  })

  // link_member_on_confirm matches on lower(email), so two members differing
  // only in case would make it arbitrary which one claimed an account.
  maybe('refuses two members whose emails differ only by case', async () => {
    const { error } = await leader.from('members').insert({
      full_name: 'Impostor', email: 'QM@TROOP.TEST', role: 'scout',
    })
    expect(error).not.toBeNull()
    expect(error.message).toMatch(/members_email_key_ci|duplicate key/i)
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

// The label list in src/constants/index.js and the roles table are two copies
// of the same vocabulary. Capabilities come from the database, but the labels
// are still UI text — so this asserts the two agree, which is the drift the
// roles table was introduced to stop.
maybeDescribe('the role vocabulary', () => {
  maybe('matches ROLES in src/constants/index.js', async () => {
    const { ROLES } = await import('../../src/constants/index.js')
    const { data } = await leader.from('roles').select('name, label').order('sort_order')

    expect(data.map(r => r.name)).toEqual(ROLES.map(r => r.value))
    expect(data.map(r => r.label)).toEqual(ROLES.map(r => r.label))
  })
})
