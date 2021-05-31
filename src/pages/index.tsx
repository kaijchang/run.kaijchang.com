import React, { useEffect, useMemo, useState } from 'react'

import ReactMapGL, { Source, Layer, InteractiveMapProps } from 'react-map-gl'

import { graphql } from 'gatsby'
import polyline from '@mapbox/polyline'

import '../styles/layout.css'

type Run = {
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

type ActivityNode = {
  activity: Run
}

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2FjaGFuZyIsImEiOiJja2N3aTFqZjgwNGk5MnlteWdoZmVkdHloIn0.0m0MAYL8eeZNWyCZOvbP8g'
const SAN_FRANCISCO_COORDS = {
  latitude: 37.739,
  longitude: -122.444,
}

type PageData = {
  allStravaActivity: {
    nodes: ActivityNode[]
  }
}

const LandingPage: React.FC<{ data: PageData }> = ({ data }) => {
  const activityNodes = data.allStravaActivity.nodes

  const [viewport, setViewport] = useState<InteractiveMapProps>({
    width: '100vw',
    height: '100vh',
    zoom: 11,
    ...SAN_FRANCISCO_COORDS
  })
  const geoData = useMemo(() => ({
    type: 'FeatureCollection' as 'FeatureCollection',
    features: activityNodes
      .filter(({ activity }) => activity.map.summary_polyline != null)
      .map(({ activity }) => {
        const featureGeoJSON = {
          type: 'Feature' as 'Feature',
          geometry: polyline.toGeoJSON(activity.map.summary_polyline),
          properties: {}
        }
        return featureGeoJSON
      })
  }), [activityNodes])

  return (
    <ReactMapGL
      {...viewport}
      onViewportChange={newViewport => {
        setViewport(oldViewport => ({
          ...oldViewport,
          ...newViewport,
          width: '100vw',
          height: '100vh',
        }))
      }}
      mapboxApiAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/kachang/ckcwjwqej0bjg1ir4v9y95fu4"
    >
      <Source id="run-data" type="geojson" data={geoData}>
        <Layer
          id="run-lines"
          type="line"
          paint={{
            'line-color': '#c05e59',
            'line-width': 2,
          }}
          layout={{
            'line-join': 'round',
            'line-cap': 'round',
          }}
        />
      </Source>
    </ReactMapGL>
  )
}

export default LandingPage

export const query = graphql`
  query {
    allStravaActivity(filter: {
      activity: {
        type: { eq: "Run" }
        start_date_local: { gt: "2019-01-01" }
      }
    }) {
      nodes {
        activity {
          id
          name
          distance
          elapsed_time
          average_speed
          start_date_local
          total_elevation_gain
          map {
            summary_polyline
          }
        }
      }
    }
  }
`
