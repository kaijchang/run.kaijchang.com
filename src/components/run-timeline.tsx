import React, { memo } from 'react'

import { ActivityNode, Run } from '../types'
import { activityToFeature } from '../utils/geojson'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
dayjs.extend(duration)

export const RunTimeline: React.FC<{
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
