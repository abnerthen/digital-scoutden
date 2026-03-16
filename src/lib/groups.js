import { supabase } from './supabase'

export async function getGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('*, group_members(*)')
    .order('name')
  if (error) throw error
  return data.map(group => ({
    ...group,
    members: group.group_members || [],
    checkouts: [],
  }))
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
        members.map(m => ({
          group_id: data.id,
          member_id: m.member_id || null,
          name: m.name,
          is_leader: m.is_leader || false,
        }))
      )
    }
  }

  const { data: fullGroup, error: fetchError } = await supabase
    .from('groups')
    .select('*, group_members(*)')
    .eq('id', data.id)
    .single()
  if (fetchError) throw fetchError
  return {
    ...fullGroup,
    members: fullGroup.group_members || [],
    checkouts: [],
  }
}