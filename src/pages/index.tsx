import React, {
  LegacyRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react'
import { graphql } from 'gatsby'

import ReactMapGL, {
  Popup,
  Source,
  Layer,
  InteractiveMapProps,
  InteractiveMap,
  LayerProps,
} from 'react-map-gl'
import Helmet from 'react-helmet'

import polyline from '@mapbox/polyline'
import fromEntries from 'fromentries'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)

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

const MAPBOX_TOKEN =
  'pk.eyJ1Ijoia2FjaGFuZyIsImEiOiJja2N3aTFqZjgwNGk5MnlteWdoZmVkdHloIn0.0m0MAYL8eeZNWyCZOvbP8g'
const SAN_FRANCISCO_COORDS = {
  latitude: 37.739,
  longitude: -122.444,
}

const metersPerSecondToMinutesPerMile = (mps: number) => 26.8224 / mps
const metersToMiles = (m: number) => m / 1609
const metersToFeet = (m: number) => m * 3.281
const formatMilesDistance = (miles: number) => miles.toFixed(2) + ' mi'
const activityToFeature = (activity: Run) =>
  ({
    id: activity.id,
    type: 'Feature',
    geometry: polyline.toGeoJSON(activity.map.summary_polyline),
    properties: activity,
  } as GeoJSON.Feature<GeoJSON.LineString, Run>)

const LAYER_STYLE = {
  type: 'line',
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
} as LayerProps

type PageData = {
  allStravaActivity: {
    nodes: ActivityNode[]
  }
}

const RunTimeline: React.FC<{
  activityNodes: ActivityNode[]
  focusedFeature: GeoJSON.Feature<GeoJSON.LineString, Run> | null
  focusFeature: (
    popup: boolean,
    feature: GeoJSON.Feature<GeoJSON.LineString, Run>,
    longLat?: [number, number]
  ) => void
  unfocusFeature: () => void
}> = ({ activityNodes, focusedFeature, focusFeature, unfocusFeature }) => {
  const width = 300
  const height = 25
  const start = activityNodes[0].activity.start_date_local
  const timespan = dayjs.duration(
    dayjs(
      activityNodes[activityNodes.length - 1].activity.start_date_local
    ).diff(start)
  )
  const step = width / timespan.asDays()
  const timeSinceFocusedFeature =
    focusedFeature &&
    dayjs
      .duration(dayjs(focusedFeature.properties.start_date_local).diff(start))
      .asDays()

  return (
    <div className="rounded-sm overflow-hidden">
      <svg width={width} height={height} fill="black">
        <g strokeWidth={step} fill="#e0e722" stroke="#e0e722">
          {activityNodes.map(({ activity }, idx) => {
            const x =
              step *
              dayjs
                .duration(dayjs(activity.start_date_local).diff(start))
                .asDays()
            return (
              <line
                key={idx}
                onMouseEnter={() => {
                  const coords = polyline.decode(activity.map.summary_polyline)
                  unfocusFeature()
                  focusFeature(
                    true,
                    activityToFeature(activity),
                    coords[Math.round(coords.length / 2)].reverse() as [
                      number,
                      number
                    ]
                  )
                }}
                x1={x}
                x2={x}
                y1={0}
                y2={height}
              />
            )
          })}
          {focusedFeature && timeSinceFocusedFeature && (
            <line
              stroke="red"
              strokeWidth={1}
              x1={step * timeSinceFocusedFeature}
              x2={step * timeSinceFocusedFeature}
              y1={0}
              y2={height}
            />
          )}
        </g>
      </svg>
    </div>
  )
}

const RunMap: React.FC<{
  activityNodes: ActivityNode[]
  visibleYears: { [year: number]: boolean }
}> = ({ activityNodes, visibleYears }) => {
  const mapRef = useRef<InteractiveMap>()
  const [
    manualFocusedFeature,
    setManualFocusedFeature,
  ] = useState<GeoJSON.Feature<GeoJSON.LineString, Run> | null>(null)
  const [hoveredCoords, setHoveredCoords] = useState<[number, number] | null>()

  const validNodes = useMemo(
    () =>
      activityNodes.filter(
        ({ activity }) =>
          visibleYears[new Date(activity.start_date_local).getFullYear()]
      ),
    [activityNodes, visibleYears]
  )
  const [offset, setOffset] = useState(1)

  useEffect(() => {
    setOffset(1)
    const interval = setInterval(() => {
      setOffset(oldOffset => {
        if (oldOffset >= validNodes.length) {
          clearInterval(interval)
          return oldOffset
        }
        return oldOffset + 1
      })
    }, 50)
    return () => clearInterval(interval)
  }, [validNodes])

  const [viewport, setViewport] = useState<InteractiveMapProps>({
    width: '100vw',
    height: '100vh',
    zoom: 11,
    ...SAN_FRANCISCO_COORDS,
  })
  const geoData = useMemo(
    () => ({
      type: 'FeatureCollection' as 'FeatureCollection',
      features: validNodes
        .slice(0, offset)
        .filter(node => node.activity.id !== manualFocusedFeature?.id)
        .map(({ activity }) => activityToFeature(activity)),
    }),
    [validNodes, offset, manualFocusedFeature]
  )

  const focusFeature = useCallback(
    (
      popup: boolean,
      feature: GeoJSON.Feature<GeoJSON.LineString, Run>,
      lngLat?: [number, number]
    ) => {
      if (!mapRef.current?.getMap().isStyleLoaded()) {
        return
      }
      setManualFocusedFeature(feature)
      if (popup && validNodes.find(node => node.activity.id === feature.id)) {
        setHoveredCoords(lngLat)
      }
    },
    []
  )
  const unfocusFeature = useCallback(() => {
    if (!mapRef.current?.getMap().isStyleLoaded()) {
      return
    }
    if (manualFocusedFeature) {
      setManualFocusedFeature(null)
      setHoveredCoords(null)
    }
  }, [manualFocusedFeature])

  const focusedFeature =
    manualFocusedFeature ||
    (validNodes[offset - 1]
      ? activityToFeature(validNodes[offset - 1].activity)
      : null)

  return (
    <>
      <span className="absolute top-0 left-0 m-2 z-10">
        <RunTimeline
          activityNodes={activityNodes}
          focusedFeature={focusedFeature}
          focusFeature={focusFeature}
          unfocusFeature={unfocusFeature}
        />
      </span>
      <ReactMapGL
        {...viewport}
        ref={mapRef as LegacyRef<InteractiveMap>}
        onViewportChange={newViewport => {
          setViewport(oldViewport => ({
            ...oldViewport,
            ...newViewport,
            width: '100vw',
            height: '100vh',
          }))
        }}
        onHover={e => {
          const feature = mapRef.current?.queryRenderedFeatures(e.point, {
            layers: ['run-lines'],
          })[0]
          unfocusFeature()
          if (feature) {
            focusFeature(
              true,
              feature as GeoJSON.Feature<GeoJSON.LineString, Run>,
              e.lngLat
            )
          }
        }}
        mapboxApiAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/kachang/ckcwk1fcn0blk1joa9aowzlur"
      >
        <Source id="run-data" type="geojson" data={geoData}>
          <Layer
            id="run-lines"
            {...LAYER_STYLE}
            paint={{
              'line-color': '#e0e722',
              'line-width': 2,
              'line-dasharray': [1, 2],
            }}
          />
        </Source>
        {focusedFeature &&
          manualFocusedFeature &&
          manualFocusedFeature.id === focusedFeature.id && (
            <Source id="focused-feature" type="geojson" data={focusedFeature}>
              <Layer
                id="focused-feature-line"
                {...LAYER_STYLE}
                paint={{
                  'line-color': 'red',
                  'line-width': 2,
                  'line-dasharray': [1, 2],
                }}
              />
            </Source>
          )}
        {manualFocusedFeature && hoveredCoords && (
          <Popup
            longitude={hoveredCoords[0]}
            latitude={hoveredCoords[1]}
            closeButton={false}
          >
            <div className="text-white">
              <p className="text-lg">{manualFocusedFeature.properties.name}</p>
              <p className="text-sm">
                {dayjs(manualFocusedFeature.properties.start_date_local).format(
                  'MM/DD/YYYY'
                )}
              </p>
              <p>
                {formatMilesDistance(
                  metersToMiles(manualFocusedFeature.properties.distance)
                )}{' '}
                &middot;{' '}
                {dayjs
                  .duration(
                    manualFocusedFeature.properties.elapsed_time,
                    'seconds'
                  )
                  .format('HH:mm:ss')}
              </p>
            </div>
          </Popup>
        )}
      </ReactMapGL>
    </>
  )
}

const RunOverlay: React.FC<{
  activitiesByYear: { [year: number]: Run[] }
  visibleYears: { [year: number]: boolean }
  setIsYearVisible: (year: number, isVisible: boolean) => void
}> = ({ activitiesByYear, visibleYears, setIsYearVisible }) => {
  const statsByYear = useMemo(() => {
    let stats: { [key: number]: [number, number, number, number] } = {}
    for (let year in activitiesByYear) {
      stats[(year as unknown) as number] = activitiesByYear[year].reduce(
        (accs, activity) => {
          return [
            accs[0] + activity.elapsed_time,
            accs[1] + activity.distance,
            accs[2] + activity.total_elevation_gain,
            ++accs[3],
          ]
        },
        [0, 0, 0, 0]
      )
    }
    return stats
  }, [activitiesByYear])

  return (
    <div className="flex flex-row md:flex-col fixed overflow-x-auto md:overflow-x-auto inset-x-0 bottom-0 md:left-auto md:top-0 md:right-0 mx-2 md:ml-0 my-10 py-4 px-4 md:px-8 rounded-md z-10 bg-black text-white border border-gray-100">
      {((Object.keys(statsByYear) as unknown) as number[])
        .sort((a, b) => +b - +a)
        .map((year, idx) => (
          <div
            className="w-40 md:w-auto min-w-40 md:min-w-0 mr-4 md:mr-0"
            key={idx}
          >
            <button
              className={`cursor-pointer select-none ${
                visibleYears[year] ? '' : 'opacity-50'
              }`}
            >
              <h1
                className="text-4xl text-neon-yellow leading-tight"
                onClick={() => setIsYearVisible(year, !visibleYears[year])}
              >
                {year}
              </h1>
            </button>
            <div className="text-gray-300">
              <p>{statsByYear[year][3]} runs</p>
              <p>{(statsByYear[year][0] / 60 / 60).toFixed(2)} hrs</p>
              <p>{formatMilesDistance(metersToMiles(statsByYear[year][1]))}</p>
              <p>
                {Math.round(
                  metersToFeet(statsByYear[year][2])
                ).toLocaleString()}{' '}
                ft elevation
              </p>
            </div>
          </div>
        ))}
      <div className="flex-grow" />
      <a
        className="font-mono text-lg mb-1 mr-2 md:mr-0"
        href="https://kaijchang.com"
        target="_blank"
      >
        kaijchang.com
      </a>
    </div>
  )
}

const LandingPage: React.FC<{ data: PageData }> = ({ data }) => {
  const activityNodes = useMemo(
    () =>
      data.allStravaActivity.nodes.sort(
        (a, b) =>
          new Date(a.activity.start_date_local).valueOf() -
          new Date(b.activity.start_date_local).valueOf()
      ),
    [data.allStravaActivity.nodes]
  )

  const activitiesByYear = useMemo(
    () =>
      activityNodes.reduce((years, { activity }: { activity: Run }) => {
        const year = activity.start_date_local.substr(0, 4)
        if (!Object.keys(years).includes(year)) {
          years[year] = []
        }
        years[year].push(activity)
        return years
      }, {} as { [key: string]: Run[] }),
    [activityNodes]
  )

  const [visibleYears, setVisibleYears] = useState(
    fromEntries(
      Object.keys(activitiesByYear).map(year => [
        year,
        parseInt(year) === new Date().getFullYear(),
      ])
    )
  )

  return (
    <>
      <Helmet>
        <title>Run</title>
      </Helmet>
      <RunMap
        activityNodes={activityNodes.filter(
          ({ activity }) => activity.map.summary_polyline !== null
        )}
        visibleYears={visibleYears}
      />
      <RunOverlay
        activitiesByYear={activitiesByYear}
        visibleYears={visibleYears}
        setIsYearVisible={(year, isVisible) =>
          setVisibleYears(oldVisibleYears => ({
            ...oldVisibleYears,
            [year]: isVisible,
          }))
        }
      />
    </>
  )
}

export default LandingPage

export const query = graphql`
  query {
    allStravaActivity(
      filter: {
        activity: {
          type: { eq: "Run" }
          start_date_local: { gt: "2019-01-01" }
        }
      }
    ) {
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
