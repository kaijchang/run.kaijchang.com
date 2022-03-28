import React, {
  LegacyRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react'
import { chakra } from '@chakra-ui/react'
import { graphql } from 'gatsby'

import ReactMapGL, {
  FlyToInterpolator,
  Popup,
  Source,
  Layer,
  InteractiveMapProps,
  InteractiveMap,
  LayerProps,
} from 'react-map-gl'
import Helmet from 'react-helmet'
import * as d3 from 'd3-ease'

import polyline from '@mapbox/polyline'
import fromEntries from 'fromentries'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)

import {
  metersToMiles,
  metersToFeet,
  formatMilesDistance,
} from '../utils/units'
import { DEFAULT_PLACE } from '../constants'
import { ActivityNode, PageData, Run, Geocoding } from '../types'

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

const RunTimeline: React.FC<{
  activityNodes: ActivityNode[]
  visibleYears: { [year: number]: boolean }
  focusedFeature: GeoJSON.Feature<GeoJSON.LineString, Run> | null
  focusFeature: (
    popup: boolean,
    feature: GeoJSON.Feature<GeoJSON.LineString, Run>,
    longLat?: [number, number]
  ) => void
  unfocusFeature: () => void
}> = memo(
  ({
    activityNodes,
    visibleYears,
    focusedFeature,
    focusFeature,
    unfocusFeature,
  }) => {
    const width = 300
    const height = 25
    const start = activityNodes[0].activity.start_date_local
    const timespan = dayjs.duration(
      dayjs(
        activityNodes[activityNodes.length - 1].activity.start_date_local
      ).diff(start)
    )
    const step = width / (timespan.asDays() + 2)
    const timeSinceFocusedFeature =
      focusedFeature &&
      dayjs
        .duration(dayjs(focusedFeature.properties.start_date_local).diff(start))
        .asDays()

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="calc(100vw - 1rem)"
        height={height}
        preserveAspectRatio="none"
        fill="black"
      >
        <g strokeWidth={step} stroke="black">
          {activityNodes.map(({ activity }, idx) => {
            const date = dayjs(activity.start_date_local)
            const x = step * (dayjs.duration(date.diff(start)).asDays() + 1)
            return (
              <line
                key={idx}
                opacity={visibleYears[date.year()] ? 1 : 0.25}
                onMouseEnter={() => {
                  const feature = activityToFeature(activity)
                  const coords = feature.geometry.coordinates
                  unfocusFeature()
                  focusFeature(
                    true,
                    feature,
                    coords[Math.round(coords.length / 2)] as [number, number]
                  )
                }}
                x1={x}
                x2={x}
                y1={0}
                y2={height}
              />
            )
          })}
          {focusedFeature && timeSinceFocusedFeature !== null && (
            <line
              stroke="red"
              strokeWidth={step}
              x1={step * (timeSinceFocusedFeature + 1)}
              x2={step * (timeSinceFocusedFeature + 1)}
              y1={0}
              y2={height}
            />
          )}
        </g>
      </svg>
    )
  }
)

const PlaceSelector: React.FC<{
  viewport: InteractiveMapProps
  setViewport: React.Dispatch<React.SetStateAction<InteractiveMapProps>>
  initialPlace: Geocoding['features'][number]
  visiblePlacesById: { [id: string]: Geocoding['features'][number] }
  validNodes: ActivityNode[]
}> = ({
  viewport,
  setViewport,
  initialPlace,
  visiblePlacesById,
  validNodes,
}) => {
  const isFirstRender = useRef(true)
  const [selectedPlaceId, setSelectedPlaceId] = useState(
    initialPlace?.id || DEFAULT_PLACE.id
  )
  const distanceByPlace = useMemo(() => {
    const distances: { [key: string]: number } = {}
    validNodes.forEach(({ activity, fields: { geocoding } }) => {
      const place = geocoding.features.find(feature =>
        feature.place_type.includes('place')
      )
      if (place) {
        distances[place.id] = (distances[place.id] || 0) + activity.distance
      }
    })
    return distances
  }, [validNodes])

  useEffect(() => {
    if (Object.values(visiblePlacesById).length === 0) {
      setSelectedPlaceId(DEFAULT_PLACE.id)
    } else if (!(selectedPlaceId in visiblePlacesById)) {
      setSelectedPlaceId(Object.values(visiblePlacesById)[0].id)
    }
  }, [visiblePlacesById])
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const selectedPlace =
      selectedPlaceId === DEFAULT_PLACE.id
        ? DEFAULT_PLACE
        : visiblePlacesById[selectedPlaceId]
    console.log(selectedPlace)
    setViewport({
      ...viewport,
      longitude: selectedPlace.center[0],
      latitude: selectedPlace.center[1],
      zoom: 10.5,
      transitionDuration: 4000,
      transitionInterpolator: new FlyToInterpolator(),
      transitionEasing: d3.easeQuad,
    })
  }, [selectedPlaceId])

  return (
    <select
      className="bg-transparent text-black border-2 rounded-md border-black"
      value={selectedPlaceId}
      onChange={e => setSelectedPlaceId(e.target.value)}
    >
      {Object.values(visiblePlacesById).length === 0 && (
        <option value={DEFAULT_PLACE.id}>{DEFAULT_PLACE.text}</option>
      )}
      {Object.values(visiblePlacesById).sort((a, b) => distanceByPlace[b.id] - distanceByPlace[a.id]).map((place, idx) => {
        return (
          <option key={idx} value={place.id}>
            {place.text} (
            {formatMilesDistance(metersToMiles(distanceByPlace[place.id]))})
          </option>
        )
      })}
    </select>
  )
}

const RunMap: React.FC<{
  activityNodes: ActivityNode[]
  finalPlaceId: string
  visiblePlacesById: { [id: string]: Geocoding['features'][number] }
  visibleYears: { [year: number]: boolean }
}> = ({ activityNodes, finalPlaceId, visiblePlacesById, visibleYears }) => {
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

  const initialPlace =
    (finalPlaceId && visiblePlacesById[finalPlaceId]) || DEFAULT_PLACE

  const [viewport, setViewport] = useState<InteractiveMapProps>({
    width: '100vw',
    height: '100vh',
    zoom: 10.5,
    longitude: initialPlace.center[0],
    latitude: initialPlace.center[1],
  })
  const geoData = useMemo(
    () => ({
      type: 'FeatureCollection' as 'FeatureCollection',
      features: validNodes
        .filter(node => node.activity.id !== manualFocusedFeature?.id)
        .map(({ activity }) => activityToFeature(activity)),
    }),
    [validNodes, manualFocusedFeature]
  )

  const focusFeature = useCallback(
    (
      popup: boolean,
      feature: GeoJSON.Feature<GeoJSON.LineString, Run>,
      lngLat?: [number, number]
    ) => {
      setManualFocusedFeature(feature)
      if (popup) {
        setHoveredCoords(lngLat)
      }
    },
    []
  )
  const unfocusFeature = useCallback(() => {
    if (manualFocusedFeature) {
      setManualFocusedFeature(null)
      setHoveredCoords(null)
    }
  }, [manualFocusedFeature])

  const focusedFeature = useMemo(
    () =>
      manualFocusedFeature ||
      (validNodes[validNodes.length - 1]
        ? activityToFeature(validNodes[validNodes.length - 1].activity)
        : null),
    [manualFocusedFeature, validNodes]
  )

  useEffect(() => {
    const mapStyleLoadListener = () => {
      if (validNodes[validNodes.length - 1]) {
        const feature = activityToFeature(
          validNodes[validNodes.length - 1].activity
        )
        const coords = feature.geometry.coordinates
        focusFeature(
          true,
          feature,
          coords[Math.round(coords.length / 2)] as [number, number]
        )
      }
    }
    mapRef.current?.getMap().on('style.load', mapStyleLoadListener)
    return () => {
      mapRef.current?.getMap().off('style.load', mapStyleLoadListener)
    }
  }, [])

  return (
    <>
      <span>
        <RunTimeline
          activityNodes={activityNodes.filter(
            ({ activity }) =>
              dayjs(activity.start_date_local) > dayjs().subtract(3, 'year')
          )}
          visibleYears={visibleYears}
          focusedFeature={focusedFeature}
          focusFeature={focusFeature}
          unfocusFeature={unfocusFeature}
        />
        <div className="mt-2">
          <PlaceSelector
            initialPlace={initialPlace as Geocoding['features'][number]}
            viewport={viewport}
            setViewport={setViewport}
            visiblePlacesById={visiblePlacesById}
            validNodes={validNodes}
          />
        </div>
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
        mapboxApiAccessToken={process.env.GATSBY_MAPBOX_TOKEN}
        mapStyle="mapbox://styles/kachang/cl04v5q4u000514nzszvggc21"
      >
        <Source id="run-data" type="geojson" data={geoData}>
          <Layer
            id="run-lines"
            {...LAYER_STYLE}
            paint={{
              'line-color': 'black',
              'line-width': 2,
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
            <div className="text-black">
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
  activitiesByYear: { [year: number]: ActivityNode[] }
  visibleYears: { [year: number]: boolean }
  setIsYearVisible: (year: number, isVisible: boolean) => void
}> = ({ activitiesByYear, visibleYears, setIsYearVisible }) => {
  const statsByYear = useMemo(() => {
    let stats: { [key: number]: [number, number, number, number] } = {}
    for (let year in activitiesByYear) {
      stats[(year as unknown) as number] = activitiesByYear[year].reduce(
        (accs, node) => {
          const { activity } = node
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
    <div className="flex flex-row md:flex-col fixed overflow-x-auto md:overflow-x-auto inset-x-0 bottom-0 md:left-auto md:top-0 md:right-0 mx-2 md:ml-0 my-10 py-4 px-4 md:px-8 z-10 bg-gray-100 text-black shadow-solid">
      {((Object.keys(statsByYear) as unknown) as number[])
        .sort((a, b) => +b - +a)
        .map((year, idx) => (
          <div
            className="w-40 md:w-auto min-w-40 md:min-w-0 mr-16 md:mr-0"
            key={idx}
          >
            <button
              className={`cursor-pointer select-none ${
                visibleYears[year] ? '' : 'opacity-50'
              }`}
            >
              <h1
                className="text-4xl leading-tight tracking-widest italic"
                onClick={() => setIsYearVisible(year, !visibleYears[year])}
              >
                {year}
              </h1>
            </button>
            <div className="text-gray-800">
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

  const statsByMonth = useMemo(() => {
    let stats: {
      [key: number]: { [key: number]: [number, number, number, number] }
    } = {}
    for (const activityNode of activityNodes) {
      const { activity } = activityNode
      const year = new Date(activity.start_date_local).getFullYear()
      const month = new Date(activity.start_date_local).getMonth()
      if (!stats[year]) {
        stats[year] = {}
      }
      if (!stats[year][month]) {
        stats[year][month] = [0, 0, 0, 0]
      }
      stats[year][month] = [
        stats[year][month][0] + activity.elapsed_time,
        stats[year][month][1] + metersToMiles(activity.distance),
        stats[year][month][2] + activity.total_elevation_gain,
        stats[year][month][3] + 1,
      ]
    }
    return stats
  }, [activityNodes])
  console.log(statsByMonth)

  const activitiesByYear = useMemo(
    () =>
      activityNodes.reduce((years, node: ActivityNode) => {
        const { activity } = node
        const year = activity.start_date_local.substr(0, 4)
        if (!(year in years)) {
          years[year] = []
        }
        years[year].push(node)
        return years
      }, {} as { [key: string]: ActivityNode[] }),
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

  const [finalPlaceId, visiblePlacesById] = useMemo(
    () =>
      activityNodes
        .filter(
          ({ activity }) =>
            visibleYears[new Date(activity.start_date_local).getFullYear()]
        )
        .reduce(
          ([finalPlaceId, places], { activity, fields: { geocoding } }) => {
            geocoding.features.forEach(feature => {
              if (feature.place_type.includes('place')) {
                if (!(feature.id in places)) places[feature.id] = feature
                if (activity.start_latlng) {
                  places[
                    feature.id
                  ].center = activity.start_latlng.slice().reverse() as [
                    number,
                    number
                  ]
                }
                finalPlaceId = feature.id
              }
            })
            return [finalPlaceId, places]
          },
          ['', {}] as [string, { [key: string]: Geocoding['features'][number] }]
        ),
    [visibleYears, activityNodes]
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
        finalPlaceId={finalPlaceId}
        visiblePlacesById={visiblePlacesById}
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
    allStravaActivity(filter: { activity: { type: { eq: "Run" } } }) {
      nodes {
        activity {
          id
          name
          distance
          elapsed_time
          average_speed
          start_date_local
          start_latlng
          total_elevation_gain
          map {
            summary_polyline
          }
        }
        fields {
          geocoding {
            features {
              id
              center
              place_type
              text
            }
          }
        }
      }
    }
  }
`
