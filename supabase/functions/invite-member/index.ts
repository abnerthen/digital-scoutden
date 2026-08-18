// Sends an invitation to a troop member so they can create a login.
//
// This exists because inviting requires the service_role key, which bypasses
// RLS entirely and therefore must never reach a browser. Everything the app
// does normally goes straight to Postgres with the publishable key; this is the
// one operation that cannot.
//
// Two clients are used deliberately:
//   caller — carries the requester's JWT, so can_manage_members() answers for
//            *them*. This is the authorisation check.
//   admin  — service_role, never leaves this function. Only used after the
//            check passes.

import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// Where the invite link lands. Set with `supabase secrets set SITE_URL=...`.
// Supabase's own redirect allow-list is the backstop if this is ever wrong:
// a non-allow-listed redirect_to falls back to the project's Site URL.
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'Not signed in' }, 401)

  // ── Authorisation ──────────────────────────────────────────────────────────
  // verify_jwt only proves the caller holds *an* account. This proves they are
  // an active member of the troop whose role may manage people. Without it, any
  // signed-in user could invite anyone.
  const caller = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  })

  const { data: allowed, error: rpcError } = await caller.rpc('can_manage_members')
  if (rpcError) return json({ error: rpcError.message }, 500)
  if (!allowed) {
    return json({ error: 'Only troop leaders may invite members.' }, 403)
  }

  let memberId: string | undefined
  try {
    ;({ memberId } = await req.json())
  } catch {
    return json({ error: 'Expected a JSON body with a memberId.' }, 400)
  }
  if (!memberId) return json({ error: 'memberId is required.' }, 400)

  // ── The invitation ─────────────────────────────────────────────────────────
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // Read the address from the database, never from the request body. A caller
  // who could name the address could invite someone to claim a member row that
  // is not theirs — and the row's role would come with it.
  const { data: member, error: memberError } = await admin
    .from('members')
    .select('id, full_name, email, auth_user_id, active')
    .eq('id', memberId)
    .maybeSingle()

  if (memberError) return json({ error: memberError.message }, 500)
  if (!member) return json({ error: 'No such member.' }, 404)
  if (!member.active) {
    return json({ error: `${member.full_name} is no longer active.` }, 409)
  }
  if (member.auth_user_id) {
    return json({ error: `${member.full_name} already has a login.` }, 409)
  }

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    member.email,
    {
      redirectTo: `${SITE_URL}/auth/set-password`,
      // Read by Root: an invited user has a session before they have a
      // password, and this is what stops them being let into the app and
      // stranded there once the invite session expires.
      data: { must_set_password: true },
    },
  )

  if (inviteError) {
    // Most often: an auth user already exists for that address, without a
    // members row pointing at it.
    return json({ error: inviteError.message }, 409)
  }

  return json({ invited: member.email, full_name: member.full_name })
})
