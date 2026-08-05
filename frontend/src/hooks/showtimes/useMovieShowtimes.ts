import { useMemo } from 'react'
import { useFetch } from '../useFetch'
import { getShowtimes } from '../../api/showtimes'
import type { ShowTime } from '../../types'

/**
 * Fetches the showtimes for one movie on a given date (optionally scoped to
 * a theater), plus the derived `theaters` list and `groupedByTheater` map
 * (grouped by theater, then by screen, deduplicated and time-sorted) that
 * MovieDetailsPage renders as theater cards and time chips.
 */
export function useMovieShowtimes(
  id: string | undefined,
  selectedDate: string,
  selectedTheater: number | 'all',
) {
  const { data: showtimes = [] } = useFetch(() => {
    const params: Record<string, string> = { movie: String(id), date: selectedDate }
    if (selectedTheater !== 'all') params.theater = String(selectedTheater)
    return getShowtimes(params).then(res => res.data)
  }, [id, selectedDate, selectedTheater])

  const theaters = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of showtimes) {
      map.set(s.theater, s.theater_name)
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [showtimes])

  // Group by theater, then by screen to avoid mixed and duplicate times
  const groupedByTheater = useMemo(() => {
    const grouped = new Map<number, Map<number, ShowTime[]>>()
    for (const s of showtimes) {
      let screens = grouped.get(s.theater)
      if (!screens) {
        screens = new Map<number, ShowTime[]>()
        grouped.set(s.theater, screens)
      }
      const arr = screens.get(s.screen) || []
      // Deduplicate by id within a screen
      if (!arr.find(x => x.id === s.id)) arr.push(s)
      // Sort by start time
      arr.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      screens.set(s.screen, arr)
    }
    return grouped
  }, [showtimes])

  return { showtimes, theaters, groupedByTheater }
}
