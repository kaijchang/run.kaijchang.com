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

const splitLineString = (
  coords: number[][],
  averageSpeed: number
): number[][][] => {
  const threshold = averageSpeed * 100
  const segments: number[][][] = []
  let current: number[][] = [coords[0]]
  for (let i = 1; i < coords.length; i++) {
    const dist = haversineDistance(coords[i - 1], coords[i])
    if (dist > threshold) {
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
  const segments = splitLineString(decoded.coordinates, activity.average_speed)
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
