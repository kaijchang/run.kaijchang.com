import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Select } from '@chakra-ui/react'

import { FlyToInterpolator, InteractiveMapProps } from 'react-map-gl'
import { DEFAULT_PLACE } from '../constants'
import { ActivityNode, Geocoding } from '../types'
import { formatMilesDistance, metersToMiles } from '../utils/units'
import * as d3 from 'd3-ease'

export const PlaceSelector: React.FC<{
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
    <Select
      maxW={300}
      size="sm"
      borderColor="black"
      rounded="md"
      fontWeight="semibold"
      borderWidth={2}
      bg="transparent"
      value={selectedPlaceId}
      onChange={e => setSelectedPlaceId(e.target.value)}
    >
      {Object.values(visiblePlacesById).length === 0 && (
        <option value={DEFAULT_PLACE.id}>{DEFAULT_PLACE.text}</option>
      )}
      {Object.values(visiblePlacesById)
        .sort((a, b) => distanceByPlace[b.id] - distanceByPlace[a.id])
        .map((place, idx) => {
          return (
            <option key={idx} value={place.id}>
              {place.text} (
              {formatMilesDistance(metersToMiles(distanceByPlace[place.id]))})
            </option>
          )
        })}
    </Select>
  )
}
