import { getAllRaces } from './raceService.js'
import { getVehicles } from './vehicleService.js'
import { getTracks } from './trackService.js'

// Aggregate stats for the Stats page. We pull everything client-side because
// the dataset per user is small (hundreds of races at most) and avoids round
// trips for each metric.
export async function getStats() {
  const [races, vehicles, tracks] = await Promise.all([
    getAllRaces(),
    getVehicles(),
    getTracks()
  ])

  return {
    mostUsedVehicle: computeMostUsedVehicle(races, vehicles),
    mostRacedVariation: computeMostRacedVariation(races, tracks),
    biggestImprovements: computeBiggestImprovements(races, tracks),
    totalRaces: races.length
  }
}

function computeMostUsedVehicle(races, vehicles) {
  const counts = countBy(races, r => r.vehicle_id)
  const winnerId = topKey(counts)
  if (!winnerId) return null
  const vehicle = vehicles.find(v => v.id === winnerId)
  return vehicle ? { name: vehicle.name, count: counts[winnerId] } : null
}

function computeMostRacedVariation(races, tracks) {
  const counts = countBy(races, r => r.track_variation_id)
  const winnerId = topKey(counts)
  if (!winnerId) return null
  const found = findVariationName(tracks, winnerId)
  if (!found) return null
  return { ...found, count: counts[winnerId] }
}

function computeBiggestImprovements(races, tracks) {
  const grouped = groupBy(races, r => r.track_variation_id)
  const improvements = []

  for (const variationId of Object.keys(grouped)) {
    const sorted = grouped[variationId]
      .filter(r => r.lap_time_ms != null)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    if (sorted.length < 2) continue

    const oldest = sorted[0].lap_time_ms
    const newest = sorted[sorted.length - 1].lap_time_ms
    const deltaMs = oldest - newest
    if (deltaMs <= 0) continue

    const found = findVariationName(tracks, variationId)
    if (!found) continue
    improvements.push({ ...found, deltaMs, oldest, newest })
  }

  improvements.sort((a, b) => b.deltaMs - a.deltaMs)
  return improvements.slice(0, 5)
}

function countBy(items, keyFn) {
  const counts = {}
  for (const item of items) {
    const key = keyFn(item)
    if (key == null) continue
    counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

function groupBy(items, keyFn) {
  const out = {}
  for (const item of items) {
    const key = keyFn(item)
    if (key == null) continue
    if (!out[key]) out[key] = []
    out[key].push(item)
  }
  return out
}

function topKey(counts) {
  let winner = null
  let best = -1
  for (const key of Object.keys(counts)) {
    if (counts[key] > best) {
      best = counts[key]
      winner = key
    }
  }
  return winner
}

function findVariationName(tracks, variationId) {
  for (const track of tracks) {
    const v = (track.track_variations || []).find(x => x.id === variationId)
    if (v) {
      return {
        trackName: track.name,
        trackSlug: track.slug,
        variationName: v.name,
        variationSlug: v.slug
      }
    }
  }
  return null
}
