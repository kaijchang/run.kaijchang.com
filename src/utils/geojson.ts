import polyline from '@mapbox/polyline'
import { Run } from '../types'

export const activityToFeature = (activity: Run) =>
({
  id: activity.id,
  type: 'Feature',
  geometry: activity.map ? polyline.toGeoJSON(activity.map!.summary_polyline) : null,
  properties: activity,
} as GeoJSON.Feature<GeoJSON.LineString, Run>)
