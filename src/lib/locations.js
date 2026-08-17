import { supabase } from './supabase';

export async function getLocations() {
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
    if (error) throw error;
    return data;
}

export async function addLocation(name) {
    const { data, error } = await supabase
        .from('locations')
        .insert({ name })
        .select()
        .single();
    if (error) throw error;
    return data;
}

export async function deleteLocation(id) {
    const { data } = await supabase
        .from('locations')
        .select('protected')
        .eq('id', id)
        .single();

    if (data?.protected) throw new Error('Cannot delete protected location');
    const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', id);
    if (error) throw error;
}
