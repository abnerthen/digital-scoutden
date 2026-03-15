import { supabase } from './supabase'

export async function getOpenTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .is('returned_at', null)
    .order('checked_out_at')
  if (error) throw error
  return data
}

export async function createCheckout(transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transaction)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function closeTransaction(id, returnData) {
  const { error } = await supabase
    .from('transactions')
    .update({ ...returnData, returned_at: new Date() })
    .eq('id', id)
  if (error) throw error
}