import { supabase } from './supabase'

export async function getGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('*, group_members(*)')
    .order('name')
  if (error) throw error
  return data
}

export async function saveGroup(group) {
  const { members, ...groupData } = group
  const { data, error } = await supabase
    .from('groups')
    .upsert(groupData)
    .select()
    .single()
  if (error) throw error

  if (members) {
    await supabase.from('group_members').delete().eq('group_id', data.id)
    if (members.length > 0) {
      await supabase.from('group_members').insert(
        members.map(m => ({ ...m, group_id: data.id }))
      )
    }
  }
  return data
}