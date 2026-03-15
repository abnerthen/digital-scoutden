import { supabase } from './supabase';

export async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
    if (error) throw error;
    return data;
}

export async function addCategory(name) {
    const { data, error } = await supabase
        .from('categories')
        .insert({ name })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteCategory(id) {
    const { data } = await supabase
        .from('categories')
        .select('protected')
        .eq('id', id)
        .single();
    
    if (data?.protected) throw new Error('Cannot delete protected category');
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
    if (error) throw error;
}