import polyline from '@mapbox/polyline'
import { Run } from '../types'

export const activityToFeature = (activity: Run) =>
  ({
    id: activity.id,
    type: 'Feature',
    geometry: polyline.toGeoJSON(activity.map.summary_polyline),
    properties: activity,
  } as GeoJSON.Feature<GeoJSON.LineString, Run>)
