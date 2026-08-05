import { useMemo, useState } from 'react'
import { useFetch } from '../useFetch'
import { useFavoriteToggle } from '../useFavoriteToggle'
import { getShowtimes } from '../../api/showtimes'
import { getMovies } from '../../api/movies'
import type { ShowTime } from '../../types'
import { timeRangeToFromTo, type TimeRange } from './useShowtimeFilters'

export type TheaterGroup = { name: string; times: ShowTime[] }
export type MovieGroup = {
  title: string
  image?: string | null
  duration?: number
  rating?: number | string
  theaters: Map<number, TheaterGroup>
}

/**
 * Fetches showtimes for `selectedDate` (scoped by `upcoming`/`timeRange`),
 * the current favorited-movie ids, and derives the movie -> theater grouping
 * ShowtimesPage renders. Mirrors the fetch/group logic that used to live
 * inline in ShowtimesPage; the client-side `q`/`mpa` filtering still happens
 * where the page iterates `items` here, since `mpa` is a per-showtime filter
 * and `q` is applied at group time (matching the original dep array).
 */
export function useShowtimes(params: {
  selectedDate: string
  upcoming: boolean
  timeRange: TimeRange
  mpa: string
  q: string
}) {
  const { selectedDate, upcoming, timeRange, mpa, q } = params
  const { toggleFavorite: toggleFavoriteBase } = useFavoriteToggle()
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())

  const { data: items = [], loading, initialLoading, error } = useFetch(() => {
    const apiParams: any = { date: selectedDate }
    if (upcoming) apiParams.upcoming = 'true'
    const ft = timeRangeToFromTo(selectedDate, timeRange)
    if (ft.from) apiParams.from = ft.from
    if (ft.to) apiParams.to = ft.to
    return getShowtimes(apiParams).then(res => res.data)
  }, [selectedDate, upcoming, timeRange], { errorFallback: 'Failed to load showtimes' })

  useFetch(
    () => getMovies({ favorited: 'true', ordering: 'title' }).then(res => {
      setFavoriteIds(new Set((res.data || []).map((m: any) => m.id)))
      return res.data
    }),
    [],
  )

  async function toggleFavorite(movieId: number) {
    await toggleFavoriteBase(movieId, favoriteIds.has(movieId), (next) => {
      setFavoriteIds(prev => {
        const nextSet = new Set(prev)
        if (next) nextSet.add(movieId)
        else nextSet.delete(movieId)
        return nextSet
      })
    })
  }

  // Group by movie -> theater for the selected date
  const groupedByMovie = useMemo(() => {
    const movies = new Map<number, MovieGroup>()
    for (const s of items) {
      // Client-side MPA filter by movie rating code
      if (mpa && s.movie_mpa_rating !== mpa) continue
      // Client-side search filter by movie or theater name
      if (q && !(`${s.movie_title} ${s.theater_name}`.toLowerCase().includes(q.toLowerCase()))) continue
      let mv = movies.get(s.movie)
      if (!mv) {
        mv = { title: s.movie_title, image: s.movie_image, duration: s.movie_duration_minutes, rating: s.movie_rating_average, theaters: new Map<number, TheaterGroup>() }
        movies.set(s.movie, mv)
      }
      if (mv && (mv.duration == null) && s.movie_duration_minutes != null) mv.duration = s.movie_duration_minutes
      if (mv && (mv.rating == null) && s.movie_rating_average != null) mv.rating = s.movie_rating_average
      let th = mv.theaters.get(s.theater)
      if (!th) {
        th = { name: s.theater_name, times: [] }
        mv.theaters.set(s.theater, th)
      }
      if (!th.times.find(x => x.id === s.id)) th.times.push(s)
    }
    for (const mv of movies.values()) {
      for (const th of mv.theaters.values()) {
        th.times.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      }
    }
    return movies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q])

  return { items, loading, initialLoading, error, favoriteIds, toggleFavorite, groupedByMovie }
}
