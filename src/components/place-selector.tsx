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
  visiblePlacesByText: { [id: string]: Geocoding['features'][number] }
  validNodes: ActivityNode[]
}> = ({
  viewport,
  setViewport,
  initialPlace,
  visiblePlacesByText,
  validNodes,
}) => {
  const isFirstRender = useRef(true)
  const [selectedPlaceText, setSelectedPlaceText] = useState(
    initialPlace?.text || DEFAULT_PLACE.text
  )
  const distanceByPlace = useMemo(() => {
    const distances: { [key: string]: number } = {}
    validNodes.forEach(({ activity, fields: { geocoding } }) => {
      const place = geocoding.features.find(feature =>
        feature.place_type.includes('place')
      )
      if (place) {
        distances[place.text] = (distances[place.text] || 0) + activity.distance
      }
    })
    return distances
  }, [validNodes])

  useEffect(() => {
    if (Object.values(visiblePlacesByText).length === 0) {
      setSelectedPlaceText(DEFAULT_PLACE.text)
    } else if (!(selectedPlaceText in visiblePlacesByText)) {
      setSelectedPlaceText(Object.values(visiblePlacesByText)[0].text)
    }
  }, [visiblePlacesByText])
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const selectedPlace =
      selectedPlaceText === DEFAULT_PLACE.text
        ? DEFAULT_PLACE
        : visiblePlacesByText[selectedPlaceText]
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
  }, [selectedPlaceText])

  return (
    <Select
      maxW={300}
      size="sm"
      borderColor="black"
      rounded="md"
      fontWeight="semibold"
      borderWidth={2}
      bg="transparent"
      value={selectedPlaceText}
      onChange={e => setSelectedPlaceText(e.target.value)}
    >
      {Object.values(visiblePlacesByText).length === 0 && (
        <option value={DEFAULT_PLACE.text}>{DEFAULT_PLACE.text}</option>
      )}
      {Object.values(visiblePlacesByText)
        .filter(place => distanceByPlace[place.text])
        .sort((a, b) => distanceByPlace[b.text] - distanceByPlace[a.text])
        .map((place, idx) => {
          return (
            <option key={idx} value={place.text}>
              {place.text} (
              {formatMilesDistance(metersToMiles(distanceByPlace[place.text]))})
            </option>
          )
        })}
    </Select>
  )
}
