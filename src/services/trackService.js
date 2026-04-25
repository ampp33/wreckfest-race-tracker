import { supabase } from './supabase.js'

export async function getTracks() {
  const { data, error } = await supabase
    .from('tracks')
    .select('id, name, slug, track_variations(id, name, slug)')
    .order('name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function getTrackBySlug(slug) {
  const { data, error } = await supabase
    .from('tracks')
    .select('id, name, slug, track_variations(id, name, slug)')
    .eq('slug', slug)
    .single()
  if (error) throw error
  return data
}

export function findVariation(track, variationSlug) {
  if (!track || !track.track_variations) return null
  return track.track_variations.find(v => v.slug === variationSlug) || null
}
