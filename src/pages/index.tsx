import React, { useMemo, useState } from 'react';

import ReactMapGL, { Source, Layer } from 'react-map-gl';
import { ViewportProvider, useDimensions } from 'react-viewport-utils';

import { graphql } from 'gatsby';
import { useTable, useFlexLayout, useSortBy } from 'react-table';
import polyline from '@mapbox/polyline';

import { Cell, Row } from 'react-table';

import '../styles/layout.css';

type Run = {
  id: number;
  name: string;
  distance: number;
  elapsed_time: number;
  average_speed: number;
  average_heartrate: number;
  total_elevation_gain: number;
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
  const [viewport, setViewport] = useState({
    width: '100%',
    height: 400,
    zoom: 10.5,
    ...SAN_FRANCISCO_COORDS
  });

  const [lastWidth, setLastWidth] = useState(0);
  const dimensions = useDimensions({
    deferUpdateUntilIdle: true,
    disableScrollUpdates: true,
  });
  if (lastWidth !== dimensions.width) {
    setTimeout(() => {
      setViewport({ width: '100%', ...viewport });
      setLastWidth(dimensions.width);
    }, 0);
  }

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
      onViewportChange={ setViewport }
    >
      { /* @ts-ignore */ }
      <Source id='data' type='geojson' data={geoData}>
        <Layer
          id='runs'
          type='line'
          paint={ {
            'line-color': '#c05e59',
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

const RunMapWithViewport: React.FC<RunMapProps> = (props) => (
  <ViewportProvider>
    <RunMap {...props}/>
  </ViewportProvider>
);

const RunSummary = ({ activityNodes }) => {
  const [totalTime, totalDistance, totalElevationGain, numRuns] = useMemo(() => activityNodes.reduce((accs, { activity }: { activity: Run }) => {
    return [accs[0] + activity.elapsed_time, accs[1] + activity.distance, accs[2] + activity.total_elevation_gain, ++accs[3]];
  }, [0, 0, 0, 0]), []);

  return (
    <div className='flex flex-col font-mono'>
      <h1 className='text-4xl'>2020 Running Log</h1>
      <p className='text-md'>
        <a href='https://yihong.run/running' className='link-underline'>Inspired by yihong.run</a>
        {' '}&bull;{' '}
        <a>Built using Mapbox and Strava</a>
      </p>
      <a href='https://www.strava.com/athletes/kachang' className='my-4'>
        <button className='flex flex-row items-center rounded-md border border-black hover:bg-Strava'>
          <span className='mx-3'>
            Add Me on Strava
          </span>
          <img src='/strava.webp' className='h-10 rounded-r-md bg-Strava px-2 py-2'/>
        </button>
      </a>
      <h2 className='text-2xl my-2'>
        { (totalTime / 60 / 60).toFixed(2) } Hours
      </h2>
      <h2 className='text-2xl my-2'>
        { formatDistance(metersToMiles(totalDistance)) }
      </h2>
      <h2 className='text-2xl my-2'>
        { metersToFeet(totalElevationGain).toLocaleString() } ft Elev. Gain
      </h2>
      <h2 className='text-2xl my-2'>
        { numRuns } Runs
      </h2>
    </div>
  );
};

const RunTable = ({ activityNodes }) => {
  const columns = useMemo(() => ([
    {
      Header: 'Date',
      Cell: ({ value }) => formatDate(new Date(value)),
      accessor: 'activity.start_date_local',
      width: 1
    },
    {
      Header: 'Name',
      accessor: 'activity.name',
      width: 2
    },
    {
      Header: 'Time',
      Cell: ({ value }) => formatTime(value),
      accessor: 'activity.elapsed_time',
      width: 1
    },
    {
      Header: 'Distance',
      Cell: ({ value }) => formatDistance(metersToMiles(value)),
      accessor: 'activity.distance',
      width: 1
    },
    {
      Header: 'Pace (min/mi)',
      Cell: ({ value }) => formatPace(metersPerSecondToMinutesPerMile(value)),
      accessor: 'activity.average_speed',
      width: 1
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
  }, useSortBy, useFlexLayout);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = tableInstance;

  return (
    <div className='w-full text-left' { ...getTableProps() }>
      <div>
        {
          headerGroups.map(headerGroup => (
            <div className='bg-Middle-Yellow-Red' {...headerGroup.getHeaderGroupProps()}>
              {
                headerGroup.headers.map(column => (
                  <div className='font-bold py-2 px-4' {...column.getHeaderProps()}>
                    { column.render('Header') }
                  </div>
               ))
              }
           </div>
         ))
        }
      </div>
      <div {...getTableBodyProps()}>
        {
          rows.map((row: Row) => {
            prepareRow(row);
            const run: Run = row.original.activity;
            return (
              <div
                className='hover:bg-Champagne-Pink cursor-pointer'
                onClick={ () => window.location.href = `https://strava.com/activities/${run.id}` }
                {...row.getRowProps()}
              >
                {
                  row.cells.map((cell: Cell) => {
                    return (
                      <div
                        className={ `py-2 px-4 ${ cell.column.id != columns[columns.length - 1].accessor ? 'border-r-2 border-Black-Coffee' : ''  }` }
                        {...cell.getCellProps()}
                      >
                        { cell.render('Cell') }
                      </div>
                    );
                  })
                }
              </div>
            );
          })
        }
      </div>
    </div>
  );
};

export default ({ data }) => (
  <>
    <div className='flex flex-col md:flex-row justify-around my-6'>
      <div className='mx-6'>
        <RunSummary activityNodes={ data.allStravaActivity.nodes }/>
      </div>
      <div className='md:mx-3'/>
      <div className='flex flex-col items-stretch md:items-start md:w-1/2 sm:mx-6'>
        <RunMapWithViewport activityNodes={ data.allStravaActivity.nodes }/>
        <div className='my-3'/>
        <RunTable activityNodes={ data.allStravaActivity.nodes }/>
      </div>
    </div>
  </>
);

const metersPerSecondToMinutesPerMile = (mps: number) => 26.8224 / mps;
const metersToMiles = (m: number) => m / 1609;
const metersToFeet = (m : number) => m * 3.281;

const formatDate = (d: Date) => `${d.getMonth() + 1}-${d.getDate()}`;
const formatPace = (minutesPerMile: number) => {
  const minutes = String(Math.floor(minutesPerMile));
  const seconds = String(Math.round(minutesPerMile % 1 * 60));
  return `${minutes}:${seconds.length == 1 ? '0' + seconds : seconds}`;
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
        start_date_local: { gt: "2020-01-01" }
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
`;
