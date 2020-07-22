import React, { useMemo, useState } from 'react';

import ReactMapGL, { Source, Layer } from 'react-map-gl';

import { graphql } from 'gatsby';
import { useTable, useSortBy } from 'react-table';
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

const RunTable = ({ activityNodes }) => {
  const columns = useMemo(() => ([
    {
      Header: 'Name',
      accessor: 'activity.name'
    },
    {
      Header: 'Date',
      Cell: ({ value }) => new Date(value).toLocaleDateString(),
      accessor: 'activity.start_date_local'
    },
    {
      Header: 'Pace',
      Cell: ({ value }) => formatPace(metersPerSecondToMinutesPerMile(value)),
      accessor: 'activity.average_speed'
    },
    {
      Header: 'Time',
      Cell: ({ value }) => formatTime(value),
      accessor: 'activity.elapsed_time'
    },
    {
      Header: 'Distance',
      Cell: ({ value }) => formatDistance(metersToMiles(value)),
      accessor: 'activity.distance'
    }
  ]), []);

  const tableInstance = useTable({
    data: activityNodes,
    columns,
    initialState: {
      sortBy: [
        {
          id: 'activity.start_date_local',
          desc: true
        }
      ]
    }
  }, useSortBy);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  return (
    <table { ...getTableProps() }>
      <thead>
        {
          headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {
                headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()}>
                    { column.render('Header') }
                  </th>
               ))
              }
           </tr>
         ))
        }
      </thead>
      <tbody {...getTableBodyProps()}>
        {
          rows.map(row => {
            prepareRow(row)

            return (
              <tr {...row.getRowProps()}>
                {
                  row.cells.map(cell => {
                    return (
                      <td {...cell.getCellProps()}>
                        { cell.render('Cell') }
                      </td>
                    );
                  })
                }
              </tr>
            );
          })
        }
      </tbody>
    </table>
  );
};

export default ({ data }) => (
  <>
    <RunMap activityNodes={ data.allStravaActivity.nodes }/>
    <RunTable activityNodes={ data.allStravaActivity.nodes }/>
  </>
);

const metersPerSecondToMinutesPerMile = (mps: number) => 26.8224 / mps;
const metersToMiles = (m: number) => m / 1609;

const formatPace = (minutesPerMile: number) => {
  const minutes = String(Math.floor(minutesPerMile));
  const seconds = String(Math.round(minutesPerMile % 1 * 60));
  return `${minutes}:${seconds.length == 1 ? '0' + seconds : seconds} min/mi`;
};
const formatTime = (timeElapsed: number) => {
  const hours = Math.floor(timeElapsed / 60 / 60);
  timeElapsed -= hours * 60 * 60;
  let minutes = Math.floor(timeElapsed / 60);
  timeElapsed -= minutes * 60;
  const minuteStr = hours > 0 && minutes < 10 ? '0' + minutes : String(minutes);
  const secondStr = timeElapsed < 10 ? '0' + timeElapsed : String(timeElapsed);
  return `${ hours > 0 ? hours + ':' : '' }${minuteStr}:${secondStr}`;
};
const formatDistance = (miles: number) => miles.toFixed(2) + ' mi';

export const query = graphql`
  query {
    allStravaActivity(filter: {
      activity: {
        type: { eq: "Run" }
      }
    }) {
      nodes {
        activity {
          name
          distance
          elapsed_time
          average_speed
          start_date_local
          map {
            summary_polyline
          }
        }
      }
    }
  }
`;
