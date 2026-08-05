import { useMemo, useState } from 'react'
import type { ShowTime } from '../../types'
import { getShowtimes } from '../../api/showtimes'
import { getMovies } from '../../api/movies'
import { useFetch } from '../useFetch'
import { useFavoriteToggle } from '../useFavoriteToggle'
import { timeRangeToFromTo, type MpaRating, type TimeRange } from './useShowtimeFilters'

export interface GroupedMovie {
  title: string
  image?: string | null
  duration?: number
  rating?: number | string
  times: ShowTime[]
}

export interface UseTheaterShowtimesFilters {
  q: string
  upcoming: boolean
  order: 'asc' | 'desc'
  timeRange: TimeRange
  mpa: MpaRating
  selectedDate: string
}

/**
 * Fetches showtimes scoped to one theater for the selected date/filters
 * (from useShowtimeFilters), plus the current user's favorited movie ids,
 * and derives the per-movie grouping TheaterShowtimesPage renders (one
 * card per movie, with that movie's showtimes for the day sorted per
 * `order`). Mirrors the byte-for-byte logic that used to live inline in
 * the page, including the pre-existing `[items, q]` dep array on the
 * grouping memo (order/mpa are read inside it but intentionally not
 * listed as deps, same as before).
 */
export function useTheaterShowtimes(theaterId: number, filters: UseTheaterShowtimesFilters) {
  const { q, upcoming, order, timeRange, mpa, selectedDate } = filters
  const { toggleFavorite: toggleFavoriteBase } = useFavoriteToggle()
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())

  const { data: items = [], loading, initialLoading, error } = useFetch(() => {
    const params: any = { theater: theaterId, date: selectedDate }
    if (upcoming) params.upcoming = 'true'
    const ft = timeRangeToFromTo(selectedDate, timeRange)
    if (ft.from) params.from = ft.from
    if (ft.to) params.to = ft.to
    return getShowtimes(params).then(res => res.data)
  }, [theaterId, selectedDate, upcoming, timeRange], { errorFallback: 'Failed to load theater showtimes' })

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

  // Group by movie for the selected date
  const groupedByMovie = useMemo(() => {
    const movies = new Map<number, GroupedMovie>()
    for (const s of items) {
      // Client-side MPA filter by movie rating code
      if (mpa && s.movie_mpa_rating !== mpa) continue
      if (q && !(`${s.movie_title}`.toLowerCase().includes(q.toLowerCase()))) continue
      let mv = movies.get(s.movie)
      if (!mv) {
        mv = { title: s.movie_title, image: s.movie_image, duration: s.movie_duration_minutes, rating: s.movie_rating_average, times: [] }
        movies.set(s.movie, mv)
      }
      if (mv && (mv.duration == null) && s.movie_duration_minutes != null) mv.duration = s.movie_duration_minutes
      if (mv && (mv.rating == null) && s.movie_rating_average != null) mv.rating = s.movie_rating_average
      mv.times.push(s)
    }
    for (const mv of movies.values()) {
      mv.times.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      if (order === 'desc') mv.times.reverse()
    }
    return movies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, q])

  return { items, loading, initialLoading, error, favoriteIds, toggleFavorite, groupedByMovie }
}
