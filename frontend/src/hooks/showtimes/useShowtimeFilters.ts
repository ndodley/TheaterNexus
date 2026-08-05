import { useMemo, useState } from 'react'
import type { FilterSection } from '../../components/AdvancedSearchPanel'

export type MpaRating = '' | 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
export type TimeRange = 'any' | 'morning' | 'afternoon' | 'evening'

function todayIso(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const ORDER_OPTIONS = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
]
const TIME_RANGE_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
]
const MPA_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'G', label: 'G' },
  { value: 'PG', label: 'PG' },
  { value: 'PG-13', label: 'PG-13' },
  { value: 'R', label: 'R' },
  { value: 'NC-17', label: 'NC-17' },
]

/**
 * The "advanced search" filter state for a showtimes listing, shared
 * byte-for-byte between ShowtimesPage and TheaterShowtimesPage. Only holds
 * UI state -- each page still builds its own API params (TheaterShowtimes
 * additionally scopes to one theater id) and does its own client-side
 * sort/filter with `q`, `order`, and `mpa`.
 *
 * `filterSections` (Sort, Time, Upcoming, MPA Rating) is the declarative
 * block definition consumed by AdvancedSearchPanel -- following the
 * RetailForge2 pattern, editing a filter means editing this file, not
 * ShowtimesPage.tsx/TheaterShowtimesPage.tsx. The original single "Time"
 * block (time-of-day radios + an "Upcoming only" checkbox together) is now
 * two sections -- "Time" and "Upcoming" -- since each declarative section
 * models one control group. "Upcoming" is a single-option checkbox
 * section (not a dedicated toggle type -- AdvancedSearchPanel's real,
 * RetailForge2-matching shape has no toggle concept).
 */
export function useShowtimeFilters() {
  const [q, setQ] = useState('')
  const [upcoming, setUpcoming] = useState(false)
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')
  const [timeRange, setTimeRange] = useState<TimeRange>('any')
  const [mpa, setMpa] = useState<MpaRating>('')
  const [selectedDate, setSelectedDate] = useState<string>(todayIso)

  /** Resets every filter (including the search text) back to its default, including today's date. */
  const resetFilters = () => {
    setQ('')
    setUpcoming(false)
    setOrder('asc')
    setTimeRange('any')
    setMpa('')
    setSelectedDate(todayIso())
  }

  const filterSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [
      { key: 'order', title: 'Sort', type: 'radio', value: order, onChange: (v) => setOrder(v as 'asc' | 'desc'), options: ORDER_OPTIONS },
      { key: 'timeRange', title: 'Time', type: 'radio', value: timeRange, onChange: (v) => setTimeRange(v as TimeRange), options: TIME_RANGE_OPTIONS },
      {
        key: 'upcoming', title: 'Upcoming', type: 'checkbox',
        values: upcoming ? ['true'] : [],
        onChange: (v) => setUpcoming((v as string[]).includes('true')),
        options: [{ value: 'true', label: 'Upcoming only' }],
      },
      { key: 'mpa', title: 'MPA Rating', type: 'radio', value: mpa, onChange: (v) => setMpa(v as MpaRating), options: MPA_OPTIONS },
    ]
    return sections
  }, [order, timeRange, upcoming, mpa])

  return {
    q, setQ,
    upcoming, setUpcoming,
    order, setOrder,
    timeRange, setTimeRange,
    mpa, setMpa,
    selectedDate, setSelectedDate,
    filterSections,
    resetFilters,
  }
}

/** Shared helper: turn a TimeRange into `{from, to}` ISO datetime params for `selectedDate`. */
export function timeRangeToFromTo(date: string, timeRange: TimeRange): { from?: string; to?: string } {
  if (timeRange === 'any') return {}
  const startEnd: Record<Exclude<TimeRange, 'any'>, [string, string]> = {
    morning: ['06:00:00', '12:00:00'],
    afternoon: ['12:00:00', '18:00:00'],
    evening: ['18:00:00', '23:59:00'],
  }
  const [s, e] = startEnd[timeRange]
  return { from: `${date}T${s}`, to: `${date}T${e}` }
}
