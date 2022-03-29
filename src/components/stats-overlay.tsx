import React, { useMemo } from 'react'
import { chakra, Heading, Stack } from '@chakra-ui/react'

import { ActivityNode } from '../types'
import {
  formatMilesDistance,
  metersToFeet,
  metersToMiles,
} from '../utils/units'

export const StatsOverlay: React.FC<{
  activitiesByYear: { [year: number]: ActivityNode[] }
  visibleYears: { [year: number]: boolean }
  setIsYearVisible: (year: number, isVisible: boolean) => void
}> = ({ activitiesByYear, visibleYears, setIsYearVisible }) => {
  const statsByYear = useMemo(() => {
    let stats: { [key: number]: [number, number, number, number] } = {}
    for (let year in activitiesByYear) {
      stats[(year as unknown) as number] = activitiesByYear[year].reduce(
        (accs, node) => {
          const { activity } = node
          return [
            accs[0] + activity.elapsed_time,
            accs[1] + activity.distance,
            accs[2] + activity.total_elevation_gain,
            ++accs[3],
          ]
        },
        [0, 0, 0, 0]
      )
    }
    return stats
  }, [activitiesByYear])

  return (
    <Stack
      direction={{ base: 'row', md: 'column' }}
      position="fixed"
      zIndex={2}
      right={0}
      left={{ base: 0, md: 'auto' }}
      top={{ md: 0 }}
      bottom={0}
      overflowY="scroll"
      my={{ base: 4, md: 12 }}
      mr={4}
      ml={{ base: 4, md: 0 }}
      p={4}
      background="white"
      borderColor="black"
      borderWidth={2}
      rounded="md"
    >
      {((Object.keys(statsByYear) as unknown) as number[])
        .sort((a, b) => +b - +a)
        .map((year, idx) => (
          <chakra.div
            minW={{ base: 40, md: 0 }}
            mr={{ base: 4, md: 0 }}
            key={idx}
          >
            <chakra.button opacity={visibleYears[year] ? 1 : 0.5}>
              <Heading
                className="text-4xl leading-tight tracking-widest italic"
                onClick={() => setIsYearVisible(year, !visibleYears[year])}
              >
                {year}
              </Heading>
            </chakra.button>
            <chakra.div>
              <chakra.p>{statsByYear[year][3]} runs</chakra.p>
              <chakra.p>
                {(statsByYear[year][0] / 60 / 60).toFixed(2)} hrs
              </chakra.p>
              <chakra.p>
                {formatMilesDistance(metersToMiles(statsByYear[year][1]))}
              </chakra.p>
              <chakra.p>
                {Math.round(
                  metersToFeet(statsByYear[year][2])
                ).toLocaleString()}{' '}
                ft elevation
              </chakra.p>
            </chakra.div>
          </chakra.div>
        ))}
    </Stack>
  )
}
