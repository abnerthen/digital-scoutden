import { supabase } from './supabase'

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithOAuth(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider, // e.g., 'google' or 'github'
    options: {
      // Directs the provider to redirect back to your callback route
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/**
 * Sets the signed-in user's password.
 *
 * Used by the invite flow: an invite link signs the user in before they have a
 * password, so `must_set_password` is cleared here — that flag is what keeps
 * them on the set-password page until they actually have credentials.
 */
export async function setPassword(password) {
  const { data, error } = await supabase.auth.updateUser({
    password,
    data: { must_set_password: false },
  })
  if (error) throw error
  return data
}

export async function getCurrentMember() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()
  if (error) throw error
  return data
}