import React, {
  LegacyRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { chakra } from '@chakra-ui/react'

import ReactMapGL, {
  InteractiveMap,
  InteractiveMapProps,
  Layer,
  Popup,
  Source,
} from 'react-map-gl'
import { DEFAULT_LAYER_STYLE, DEFAULT_PLACE } from '../constants'
import { ActivityNode, Geocoding, Run } from '../types'
import { activityToFeature } from '../utils/geojson'
import { RunTimeline } from './run-timeline'
import dayjs from 'dayjs'
import { PlaceSelector } from './place-selector'
import { formatMilesDistance, metersToMiles } from '../utils/units'

export const RunMap: React.FC<{
  activityNodes: ActivityNode[]
  finalPlaceId: string
  visiblePlacesById: { [text: string]: Geocoding['features'][number] }
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
      <chakra.div position="absolute" zIndex={2} margin={2}>
        <RunTimeline
          activityNodes={activityNodes.filter(
            ({ activity }) =>
              dayjs(activity.start_date_local) > dayjs().subtract(1, 'year')
          )}
          visibleYears={visibleYears}
          focusedFeature={focusedFeature}
          focusFeature={focusFeature}
          unfocusFeature={unfocusFeature}
        />
        <chakra.div mt={2}>
          <PlaceSelector
            initialPlace={initialPlace as Geocoding['features'][number]}
            viewport={viewport}
            setViewport={setViewport}
            visiblePlacesById={visiblePlacesById}
            validNodes={validNodes}
          />
        </chakra.div>
      </chakra.div>
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
            {...DEFAULT_LAYER_STYLE}
            paint={{
              'line-color': 'black',
              'line-width': 2,
              'line-opacity': 0.3,
            }}
          />
        </Source>
        {focusedFeature &&
          manualFocusedFeature &&
          manualFocusedFeature.id === focusedFeature.id && (
            <Source id="focused-feature" type="geojson" data={focusedFeature}>
              <Layer
                id="focused-feature-line"
                {...DEFAULT_LAYER_STYLE}
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
            <chakra.div>
              <chakra.p fontSize="lg">
                {manualFocusedFeature.properties.name}
              </chakra.p>
              <chakra.p fontSize="sm">
                {dayjs(manualFocusedFeature.properties.start_date_local).format(
                  'MM/DD/YYYY'
                )}
              </chakra.p>
              <chakra.p fontSize="sm">
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
              </chakra.p>
            </chakra.div>
          </Popup>
        )}
      </ReactMapGL>
    </>
  )
}
