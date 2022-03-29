import { LayerProps } from "react-map-gl"

export const DEFAULT_PLACE = {
  "id": "place.13229035407559250",
  "center": [
    -122.463,
    37.7648
  ],
  "place_type": [
    "place"
  ],
  "text": "San Francisco"
}

export const DEFAULT_LAYER_STYLE = {
  type: 'line',
  layout: {
    'line-join': 'round',
    'line-cap': 'round',
  },
} as LayerProps
