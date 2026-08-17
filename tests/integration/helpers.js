import { createClient } from '@supabase/supabase-js'
import { execFileSync } from 'node:child_process'

// Fixed local-stack credentials from `npx supabase start`. Identical on every
// machine and documented publicly, so they are safe to commit.
export const LOCAL_URL = 'http://127.0.0.1:54321'
export const LOCAL_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

/**
 * The local stack's service_role key, read at run time rather than written
 * down.
 *
 * It is local-only and identical on every machine, but it carries the shape of
 * a real Supabase secret key — committing it trips GitHub's push protection,
 * and the way past that is an allow-list entry that would then also wave
 * through a genuine key. Cheaper to ask the CLI.
 */
let cachedServiceKey
function localServiceKey() {
  if (cachedServiceKey) return cachedServiceKey
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return (cachedServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  try {
    const status = JSON.parse(
      execFileSync('npx', ['supabase', 'status', '-o', 'json'], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      })
    )
    return (cachedServiceKey = status.SECRET_KEY || status.SERVICE_ROLE_KEY)
  } catch {
    // Stack is down; every test here is skipped anyway.
    return (cachedServiceKey = 'unavailable')
  }
}

// Seeded by supabase/seed.sql. One login per privilege tier.
export const LOGINS = {
  quartermaster: 'qm@troop.test',
  leader: 'sam@troop.test',
  scout: 'jordan@troop.test',
  inactive: 'former@troop.test', // still a quartermaster, but active = false
}

// Seeded by supabase/seed.sql
export const SEED = {
  email: 'qm@troop.test',
  password: 'password123',
  qm: 'b0000000-0000-4000-8000-000000000001',
  assistantQm: 'b0000000-0000-4000-8000-000000000002',
  scout: 'b0000000-0000-4000-8000-000000000004',
  tent: 'd0000000-0000-4000-8000-000000000001',
  lamp: 'd0000000-0000-4000-8000-000000000007',
  tentage: 'c0000000-0000-4000-8000-000000000001',
  shelfA: 'a1000000-0000-4000-8000-000000000001',
  loft: 'a1000000-0000-4000-8000-000000000004',
  eaglePatrol: 'e0000000-0000-4000-8000-000000000001',
  openTx: 'f0000000-0000-4000-8000-000000000001',
}

/** True when the local Supabase stack is reachable. */
export async function stackIsRunning() {
  try {
    const res = await fetch(`${LOCAL_URL}/rest/v1/`, {
      headers: { apikey: LOCAL_KEY },
      signal: AbortSignal.timeout(2000),
    })
    return res.status < 500
  } catch {
    return false
  }
}

/** A client with no session — used to prove RLS actually denies access. */
export function anonClient() {
  return createClient(LOCAL_URL, LOCAL_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** A client signed in as the seeded quartermaster. */
export async function signedInClient() {
  return clientFor(SEED.email)
}

/** A client signed in as any seeded member. */
export async function clientFor(email, password = SEED.password) {
  const client = createClient(LOCAL_URL, LOCAL_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(`Could not sign in as ${email}: ${error.message}`)
  return client
}

/**
 * A client for a freshly signed-up account with no members row — the shape of
 * an outsider who found the publishable key in the JS bundle.
 */
export async function strangerClient() {
  const client = createClient(LOCAL_URL, LOCAL_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const email = `stranger-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`
  const { error } = await client.auth.signUp({ email, password: 'hunter2hunter2' })
  if (error) throw new Error(`Could not sign up a stranger: ${error.message}`)
  return client
}

/** A service_role client — creates auth users the way an invitation does. */
export function adminClient() {
  return createClient(LOCAL_URL, localServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * Removes any account for an address, so a test that creates one can be run
 * twice. Deleting the auth user also clears members.auth_user_id, via the
 * foreign key's ON DELETE SET NULL.
 */
export async function deleteAccountFor(email) {
  const admin = adminClient()
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  for (const user of data?.users ?? []) {
    if (user.email?.toLowerCase() === email.toLowerCase()) {
      await admin.auth.admin.deleteUser(user.id)
    }
  }
}
