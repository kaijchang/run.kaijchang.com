import React, { useEffect, useMemo, useState } from 'react';

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

type ActivityNode = {
  activity: Run;
};

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia2FjaGFuZyIsImEiOiJja2N3aTFqZjgwNGk5MnlteWdoZmVkdHloIn0.0m0MAYL8eeZNWyCZOvbP8g';
const SAN_FRANCISCO_COORDS = {
  latitude: 37.7377,
  longitude: -122.4376,
};

type RunVisProps = {
  activityNodes: ActivityNode[];
};

const RunMap: React.FC<RunVisProps> = ({ activityNodes }) => {
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
      setViewport({ ...viewport, width: '100%' });
      setLastWidth(dimensions.width);
    }, 0);
  }

  const [timestep, setTimestep] = useState(0);
  const endTimestep = useMemo(() => Math.max(
    ...activityNodes
      .filter(({ activity }) => activity.map.summary_polyline != null)
      .map(({ activity }, idx) => polyline.decode(activity.map.summary_polyline).length + idx)
  ), []);
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestep(curTimestep => {
        const nextTimestep = curTimestep + 5;
        if (nextTimestep > endTimestep) {
          clearInterval(interval);
          return endTimestep;
        }
        return nextTimestep;
      });
    }, 100);
  }, []);

  const geoData = useMemo(() => ({
    type: 'FeatureCollection',
    features: activityNodes
      .filter(({ activity }) => activity.map.summary_polyline != null)
      .map(({ activity }, offset) => {
        const geoJSON = {
          type: 'Feature',
          geometry: polyline.toGeoJSON(activity.map.summary_polyline)
        };
        if (timestep == endTimestep) return geoJSON;
        if (offset > timestep) return {};
        geoJSON.geometry.coordinates = geoJSON.geometry.coordinates.slice(0, timestep - offset);
        return geoJSON
      })
  }), [activityNodes, timestep]);

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

const RunMapWithViewport: React.FC<RunVisProps> = (props) => (
  <ViewportProvider>
    <RunMap {...props}/>
  </ViewportProvider>
);

const RunSummary: React.FC<{ activityNodes: { activity: Run }[] }> = ({ activityNodes }) => {
  const [totalTime, totalDistance, totalElevationGain, numRuns] = useMemo(() => activityNodes.reduce((accs, { activity }: { activity: Run }) => {
    return [accs[0] + activity.elapsed_time, accs[1] + activity.distance, accs[2] + activity.total_elevation_gain, ++accs[3]];
  }, [0, 0, 0, 0]), [activityNodes]);

  return (
    <div className='flex flex-col items-start font-mono'>
      <h1 className='text-4xl'>2020 Running Log</h1>
      <p className='text-md'>
        <a href='https://yihong.run/running' className='link-underline'>Inspired by yihong.run</a>
        {' '}&bull;{' '}
        <a>Built using Mapbox and Strava</a>
      </p>
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

const RunTable: React.FC<RunVisProps> = ({ activityNodes }) => {
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
              <a
                className='hover:bg-Champagne-Pink cursor-pointer'
                href={ `https://strava.com/activities/${run.id}` }
                target='_blank'
                rel='noopener noreferrer'
                {...row.getRowProps()}
              >
                {
                  row.cells.map((cell: Cell) => {
                    return (
                      <div
                        className={ `py-2 px-4 ${ cell.column.id != columns[columns.length - 1].accessor ? 'border-r border-Black-Coffee' : ''  }` }
                        {...cell.getCellProps()}
                      >
                        { cell.render('Cell') }
                      </div>
                    );
                  })
                }
              </a>
            );
          })
        }
      </div>
    </div>
  );
};

type PageData = {
  allStravaActivity: {
    nodes: ActivityNode[];
  }
};

export default ({ data }: { data: PageData }) => {
  const activityNodes = data.allStravaActivity.nodes;
  
  return (
    <div className='flex flex-col md:flex-row justify-around my-6'>
      <div className='mx-6'>
        <RunSummary activityNodes={ activityNodes }/>
      </div>
      <div className='md:mx-3'/>
      <div className='flex flex-col items-stretch md:items-start md:w-1/2 sm:mx-6'>
        <RunMapWithViewport activityNodes={ activityNodes }/>
        <div className='my-3'/>
        <RunTable activityNodes={ activityNodes }/>
      </div>
    </div>
  );
};

const metersPerSecondToMinutesPerMile = (mps: number) => 26.8224 / mps;
const metersToMiles = (m: number) => m / 1609;
const metersToFeet = (m : number) => m * 3.281;

const formatDate = (d: Date) => `${d.getMonth() + 1}-${d.getDate()}-${d.getFullYear().toString().substr(2)}`;
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
