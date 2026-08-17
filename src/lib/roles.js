import { supabase } from './supabase'

/**
 * The troop role vocabulary and what each role may do.
 *
 * Read-only: the table has no write policy, so roles change by migration only.
 * Sourced from the database rather than from a constant so the app and the RLS
 * policies cannot disagree about who counts as a quartermaster.
 */
export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('sort_order')
  if (error) throw error
  return data
}
