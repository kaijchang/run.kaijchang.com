import React, { useMemo, useState } from 'react'
import { graphql } from 'gatsby'
import Helmet from 'react-helmet'

import fromEntries from 'fromentries'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)

import { metersToMiles } from '../utils/units'
import { ActivityNode, PageData, Geocoding } from '../types'
import { RunMap } from '../components/run-map'
import { StatsOverlay } from '../components/stats-overlay'

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

  const [finalPlaceText, visiblePlacesByText] = useMemo(
    () =>
      activityNodes
        .filter(
          ({ activity }) =>
            visibleYears[new Date(activity.start_date_local).getFullYear()]
        )
        .reduce(
          ([finalPlaceText, places], { activity, fields: { geocoding } }) => {
            geocoding.features.forEach(feature => {
              if (feature.place_type.includes('place')) {
                if (!(feature.text in places)) places[feature.text] = feature
                if (activity.start_latlng) {
                  places[
                    feature.text
                  ].center = activity.start_latlng.slice().reverse() as [
                    number,
                    number
                  ]
                }
                finalPlaceText = feature.text
              }
            })
            return [finalPlaceText, places]
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
          ({ activity }) => !!activity.map?.summary_polyline
        )}
        finalPlaceText={finalPlaceText}
        visiblePlacesByText={visiblePlacesByText}
        visibleYears={visibleYears}
      />
      <StatsOverlay
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
