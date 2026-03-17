import { supabase } from './supabase'

export async function getMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('active', true)
    .order('full_name')
  if (error) throw error
  return data
}

export async function addMember(member) {
  const { data, error } = await supabase
    .from('members')
    .insert(member)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deactivateMember(id) {
  const { data, error } = await supabase
    .from('members')
    .update({ active: false })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMember(id, updates) {
  const { data, error } = await supabase
    .from('members')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function restoreMember(id) {
  const { data, error } = await supabase
    .from('members')
    .update({ active: true })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getInactiveMembers() {
  const { data, error } = await supabase
    .from('members')
    .select('*')
    .eq('active', false)
    .order('full_name')
  if (error) throw error
  return data
}