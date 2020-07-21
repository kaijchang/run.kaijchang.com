import React, { useMemo, useState } from 'react';

import ReactMapGL, { Source, Layer } from 'react-map-gl';

import { graphql } from 'gatsby';
import polyline from '@mapbox/polyline';

import '../styles/layout.css';

type Run = {
  name: string;
  distance: number;
  elapsed_time: number;
  average_speed: number;
  average_heartrate: number;
  start_date_local: string;
  map: {
    summary_polyline: string;
  }
};

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2FjaGFuZyIsImEiOiJja2N3aTFqZjgwNGk5MnlteWdoZmVkdHloIn0.0m0MAYL8eeZNWyCZOvbP8g';
const SAN_FRANCISCO_COORDS = {
  latitude: 37.7377,
  longitude: -122.4376,
};

type RunMapProps = {
  activityNodes: {
    activity: Run
  }[];
};

const RunMap: React.FC<RunMapProps> = ({ activityNodes }) => {
  const [viewport, setViewPort] = useState({
    width: 600,
    height: 400,
    zoom: 10.5,
    ...SAN_FRANCISCO_COORDS
  });

  const geoData = useMemo(() => ({
    type: 'FeatureCollection',
    features: activityNodes
      .filter(({ activity }) => activity.map.summary_polyline != null)
      .map(({ activity }) => ({
        type: 'Feature',
        geometry: polyline.toGeoJSON(activity.map.summary_polyline)
      }))
  }), []);

  return (
    <ReactMapGL
      { ...viewport }
      mapboxApiAccessToken={ MAPBOX_TOKEN }
      mapStyle='mapbox://styles/kachang/ckcwjwqej0bjg1ir4v9y95fu4'
      // @ts-ignore
      onViewPortChange={ setViewPort }
      style={ { margin: 'auto' } }
    >
      { /* @ts-ignore */ }
      <Source id='data' type='geojson' data={geoData}>
        <Layer
          id='runs'
          type='line'
          paint={ {
            'line-color': '#D3C1C3',
            'line-width': 2,
          } }
          layout={ {
            'line-join': 'round',
            'line-cap': 'round',
          } }
        />
      </Source>
    </ReactMapGL>
  );
};

export default ({ data }) => (
  <RunMap activityNodes={ data.allStravaActivity.nodes }/>
);

export const qxuery = graphql`
  query {
    allStravaActivity {
      nodes {
        activity {
          name
          distance
          elapsed_time
          average_speed
          average_heartrate
          start_date_local
          map {
            summary_polyline
          }
        }
      }
    }
  }
`;
