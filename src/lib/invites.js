import { supabase } from './supabase'

/**
 * Invites a member to create a login.
 *
 * Goes through the invite-member Edge Function rather than straight to
 * Postgres: creating an auth user needs the service_role key, which bypasses
 * RLS and so must never be shipped to a browser. The function checks
 * can_manage_members() for the caller before doing anything.
 *
 * invoke() attaches the current session's JWT, which is what the function
 * checks the caller's role with.
 */
export async function inviteMember(memberId) {
  const { data, error } = await supabase.functions.invoke('invite-member', {
    body: { memberId },
  })

  // A non-2xx reply arrives as a FunctionsHttpError whose useful message is in
  // the response body, not in error.message — which would otherwise surface to
  // a troop leader as the unhelpful "Edge Function returned a non-2xx status".
  if (error) {
    const detail = await error.context?.json?.().catch(() => null)
    throw new Error(detail?.error || error.message)
  }
  return data
}
