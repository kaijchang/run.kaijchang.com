export type Run = {
  id: number
  name: string
  distance: number
  elapsed_time: number
  moving_time: number
  start_latlng: [number, number]
  average_speed: number
  average_heartrate: number
  total_elevation_gain: number
  start_date_local: string
  map: {
    summary_polyline: string
  } | null
}

export type ActivityNode = {
  activity: Run
  fields: {
    geocoding: Geocoding
  }
}

export type Geocoding = {
  type: 'FeatureCollection'
  attribution: string
  features: {
    id: string
    type: 'Feature'
    place_type: string[]
    relevance: number
    properties: {
      accuracy: string
      wikidata: string
      short_code: string
      foursquare: string
      landmark: bool
      address: string
      category: string
    }
    text: string
    place_name: string
    center: [number, number]
    geometry: {
      type: 'Point'
      coordinates: [number, number]
    }
    address: string
    context: {
      id: string
      text: string
      wikidata: string
      short_code: string
    }[]
    bbox: number[]
  }[]
}

export type PageData = {
  allStravaActivity: {
    nodes: ActivityNode[]
  }
}
