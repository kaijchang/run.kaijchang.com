export type Run = {
  id: number
  name: string
  distance: number
  elapsed_time: number
  average_speed: number
  average_heartrate: number
  total_elevation_gain: number
  start_date_local: string
  map: {
    summary_polyline: string
  }
}

export type ActivityNode = {
  activity: Run
}

export type PageData = {
  allStravaActivity: {
    nodes: ActivityNode[]
  }
}
