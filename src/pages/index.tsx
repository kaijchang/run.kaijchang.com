import React, { useMemo, useState } from 'react'

import ReactMapGL, { Source, Layer, InteractiveMapProps } from 'react-map-gl'
import Helmet from 'react-helmet'

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

const metersPerSecondToMinutesPerMile = (mps: number) => 26.8224 / mps
const metersToMiles = (m: number) => m / 1609
const metersToFeet = (m : number) => m * 3.281
const formatMilesDistance = (miles: number) => miles.toFixed(2) + ' mi'

type PageData = {
  allStravaActivity: {
    nodes: ActivityNode[]
  }
}

const RunMap: React.FC<{ data: PageData }> = ({ data }) => {
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
      mapStyle="mapbox://styles/kachang/ckcwk1fcn0blk1joa9aowzlur"
    >
      <Source id="run-data" type="geojson" data={geoData}>
        <Layer
          id="run-lines"
          type="line"
          paint={{
            'line-color': '#e0e722',
            'line-width': 2,
            'line-dasharray': [1, 2],
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

const RunOverlay: React.FC<{ data: PageData }> = ({ data }) => {
  const activityNodes = data.allStravaActivity.nodes
  
  const activitiesByYear = useMemo(() => activityNodes.reduce((years, { activity }: { activity: Run }) => {
    const year = activity.start_date_local.substr(0, 4);
    if (!Object.keys(years).includes(year)) {
      years[year] = []
    }
    years[year].push(activity);
    return years;
  }, {} as { [key: string]: Run[] }), [activityNodes])
  const statsByYear = useMemo(() => {
    let stats: { [key: string]: [number, number, number, number] } = {};
    for (let year in activitiesByYear) {
      stats[year] = activitiesByYear[year].reduce((accs, activity) => {
        return [accs[0] + activity.elapsed_time, accs[1] + activity.distance, accs[2] + activity.total_elevation_gain, ++accs[3]];
      }, [0, 0, 0, 0]);
    }
    return stats;
  }, [activitiesByYear])

  return (
    <div className="flex flex-row md:flex-col fixed overflow-x-scroll md:overflow-x-auto inset-x-0 bottom-0 md:left-auto md:top-0 md:right-0 mx-2 md:ml-0 my-10 py-2 px-4 md:px-8 rounded-md z-10 bg-black text-white border border-gray-100">
      {
        Object.keys(statsByYear)
          .sort((a, b) => +b - +a)
          .map((year, idx) => (
            <div className="w-40 md:w-full min-w-40 md:min-w-0 mr-4 md:m-none" key={idx}>
              <h1 className="text-4xl text-neon-yellow leading-tight">{year}</h1>
              <div className="text-gray-300">
                <p>{statsByYear[year][3]} runs</p>
                <p>{(statsByYear[year][0] / 60 / 60).toFixed(2)} hrs</p>
                <p>{formatMilesDistance(metersToMiles(statsByYear[year][1]))}</p>
                <p>{Math.round(metersToFeet(statsByYear[year][2])).toLocaleString()} ft elevation</p>
              </div>
            </div>
          ))
      }
    </div>
  )
}

const LandingPage: React.FC<{ data: PageData }> = ({ data }) => {
  return (
    <>
      <Helmet>
        <title>Run</title>
      </Helmet>
      <RunMap data={data} />
      <RunOverlay data={data} />
    </>
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
