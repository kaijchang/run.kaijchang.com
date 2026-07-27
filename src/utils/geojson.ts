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

// A "jump" is the long straight artifact left when a watch is paused and
// resumed somewhere else, or when GPS teleports — we hide it by splitting the
// path there. The hard part is telling a jump apart from a genuinely long,
// straight stretch of running: summary_polyline is geometrically simplified, so
// a real straightaway (a bridge, a seawall path, a highway shoulder) also
// collapses to two points hundreds — occasionally thousands — of meters apart.
// Distance alone can't distinguish them at any threshold.
//
// The tell is `activity.distance`, the distance actually recorded. A real jump
// inflates the drawn polyline *beyond* what you ran (the teleport adds length
// nobody moved), so the path is meaningfully longer than the recorded distance.
// A long straight — or a simplified curve — never is; if anything the polyline
// runs a bit short because simplification cuts corners. So we only look for
// jumps when the path carries real "phantom" distance, and then cut only the
// large gaps. (JUMP_GAP_METERS / JUMP_EXCESS_METERS are the tuning knobs.)
const JUMP_GAP_METERS = 600
const JUMP_EXCESS_METERS = 400

const splitLineString = (
  coords: number[][],
  distance: number
): number[][][] => {
  if (coords.length < 2) {
    return []
  }
  const gaps = coords
    .slice(1)
    .map((coord, i) => haversineDistance(coords[i], coord))
  const excess = gaps.reduce((a, b) => a + b, 0) - distance
  // No phantom distance → no jump to hide, keep the run whole.
  if (excess <= JUMP_EXCESS_METERS) {
    return [coords]
  }

  const segments: number[][][] = []
  let current: number[][] = [coords[0]]
  for (let i = 1; i < coords.length; i++) {
    if (gaps[i - 1] > JUMP_GAP_METERS) {
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
      geometry: { type: 'MultiLineString', coordinates: [] },
      properties: activity,
    } as GeoJSON.Feature<GeoJSON.MultiLineString, Run>
  }
  const decoded = polyline.toGeoJSON(activity.map.summary_polyline)
  const segments = splitLineString(decoded.coordinates, activity.distance)
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
