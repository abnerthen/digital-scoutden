import { supabase } from './supabase'

export async function getItems() {
  const { data, error } = await supabase
    .from('items')
    .select('*, categories(name)')
    .order('category_id')
  if (error) throw error
  return data.map(item => ({
    ...item,
    total_owned: item.total_owned,
    category: item.categories?.name || 'Uncategorized',
  }))
}

export async function uploadItemImage(file, itemId) {
  const ext = file.name.split('.').pop()
  const path = `${itemId}.${ext}`
  const { error } = await supabase.storage
    .from('item-images')
    .upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage
    .from('item-images')
    .getPublicUrl(path)
  return data.publicUrl
}

export async function addItem(item) {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select('*, categories(name)')
    .single()
  if (error) throw error
  return {
    ...data,
    total_owned: data.total_owned,
    category: data.categories?.name || 'Other',
  }
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


export async function updateItem(id, updates) {
  const { error } = await supabase
    .from('items')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', id)
  if (error) throw error
}