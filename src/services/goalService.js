import { supabase } from './supabase.js'

export async function getGoalForVariation(variationId) {
  const { data, error } = await supabase
    .from('goals')
    .select('id, track_variation_id, goal_lap_time_ms, updated_at')
    .eq('track_variation_id', variationId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertGoal({ variationId, goalLapTimeMs, userId }) {
  const payload = {
    user_id: userId,
    track_variation_id: variationId,
    goal_lap_time_ms: goalLapTimeMs,
    updated_at: new Date().toISOString()
  }
  const { data, error } = await supabase
    .from('goals')
    .upsert(payload, { onConflict: 'user_id,track_variation_id' })
    .select('id, track_variation_id, goal_lap_time_ms, updated_at')
    .single()
  if (error) throw error
  return data
}
