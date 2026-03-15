import { supabase } from './supabase'

export async function getItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('category')
  if (error) throw error
  return data
}

export async function addItem(item) {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateItemQuantity(id, quantity, totalOwned) {
  const { error } = await supabase
    .from('items')
    .update({ quantity, total_owned: totalOwned, updated_at: new Date() })
    .eq('id', id)
  if (error) throw error
}

export async function archiveItem(id, reason) {
  const { error } = await supabase
    .from('items')
    .update({ removed: true, removed_reason: reason, updated_at: new Date() })
    .eq('id', id)
  if (error) throw error
}