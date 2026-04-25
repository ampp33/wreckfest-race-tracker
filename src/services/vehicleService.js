import { supabase } from './supabase.js'

export async function getVehicles() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, name, class, image_url')
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}
