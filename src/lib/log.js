import { supabase } from './supabase'

export async function getLog() {
  const { data, error } = await supabase
    .from('log')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function writeLog(entry) {
  const { error } = await supabase
    .from('log')
    .insert(entry)
  if (error) throw error
}