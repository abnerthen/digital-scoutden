import { createClient } from '@supabase/supabase-js'

// Fixed local-stack credentials from `npx supabase start`. Identical on every
// machine and documented publicly, so they are safe to commit.
export const LOCAL_URL = 'http://127.0.0.1:54321'
export const LOCAL_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

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
  const client = createClient(LOCAL_URL, LOCAL_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: SEED.email, password: SEED.password,
  })
  if (error) throw new Error(`Could not sign in as ${SEED.email}: ${error.message}`)
  return client
}
