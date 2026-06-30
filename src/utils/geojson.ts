import polyline from '@mapbox/polyline'
import { Run } from '../types'

const haversineDistance = (
  [lon1, lat1]: number[],
  [lon2, lat2]: number[]
): number => {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// A "jump" is the straight artifact left when a watch is paused and resumed
// somewhere else, or when GPS drops out — we hide it by splitting the path
// there. The catch: summary_polyline is geometrically simplified, so a long
// straight road also collapses to two far-apart points. A fixed distance
// threshold (the old `average_speed * 100`) couldn't tell those apart and cut
// real straightaways. Instead, only treat a gap as a jump when it both clears
// an absolute floor AND dwarfs the activity's own typical point spacing —
// something a genuine straight segment never does.
const JUMP_FLOOR_METERS = 250
const JUMP_SPACING_MULTIPLE = 10

const splitLineString = (coords: number[][]): number[][][] => {
  if (coords.length < 2) {
    return []
  }
  const gaps = coords
    .slice(1)
    .map((coord, i) => haversineDistance(coords[i], coord))
  const medianGap = [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)]
  const threshold = Math.max(
    JUMP_FLOOR_METERS,
    medianGap * JUMP_SPACING_MULTIPLE
  )

  const segments: number[][][] = []
  let current: number[][] = [coords[0]]
  for (let i = 1; i < coords.length; i++) {
    if (gaps[i - 1] > threshold) {
      segments.push(current)
      current = []
    }
    current.push(coords[i])
  }
  segments.push(current)
  return segments.filter(s => s.length >= 2)
}

export const activityToFeature = (activity: Run) => {
  if (!activity.map) {
    return {
      id: activity.id,
      type: 'Feature',
      geometry: null,
      properties: activity,
    } as GeoJSON.Feature<GeoJSON.MultiLineString, Run>
  }
  const decoded = polyline.toGeoJSON(activity.map.summary_polyline)
  const segments = splitLineString(decoded.coordinates)
  return {
    id: activity.id,
    type: 'Feature',
    geometry:
      segments.length === 1
        ? { type: 'LineString', coordinates: segments[0] }
        : { type: 'MultiLineString', coordinates: segments },
    properties: activity,
  } as GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString, Run>
}

// Returns a representative midpoint to anchor the run's popup on. The geometry
// may be a LineString (number[][]) or a MultiLineString (number[][][], when the
// run was split at jumps), so flatten to a single list of points before picking
// the middle one. Returns null when there is no geometry to anchor to.
export const featureMidpoint = (
  feature: GeoJSON.Feature<GeoJSON.LineString | GeoJSON.MultiLineString, Run>
): [number, number] | null => {
  const points =
    feature.geometry?.type === 'MultiLineString'
      ? (feature.geometry.coordinates as number[][][]).flat()
      : (feature.geometry?.coordinates as number[][]) ?? []
  if (!points.length) {
    return null
  }
  return points[Math.floor(points.length / 2)] as [number, number]
}
