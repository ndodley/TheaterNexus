import { useMemo, useState } from 'react'
import type { Availability, Genre, Movie } from '../../types'
import type { FilterSection } from '../../components/AdvancedSearchPanel'

export type MpaRating = '' | 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'
export type FavoritesSortField = 'title' | 'rating' | 'duration' | 'release_date'

const SORT_OPTIONS = [
  { value: 'title', label: 'Title' },
  { value: 'rating', label: 'Rating' },
  { value: 'duration', label: 'Duration' },
  { value: 'release_date', label: 'Release Date' },
]
const ORDER_OPTIONS = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
]
const STATUS_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'NOW_SHOWING', label: 'Now Showing' },
  { value: 'COMING_SOON', label: 'Coming Soon' },
  { value: 'ENDED', label: 'Ended' },
]
const DURATION_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'le90', label: '≤ 90 min' },
  { value: '91to120', label: '91–120 min' },
  { value: '121to150', label: '121–150 min' },
  { value: 'ge151', label: '≥ 151 min' },
]
const DURATION_BOUNDS: Record<string, [number, number]> = {
  any: [0, Infinity],
  le90: [0, 90],
  '91to120': [91, 120],
  '121to150': [121, 150],
  ge151: [151, Infinity],
}
const RATING_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '5', label: '5+' },
  { value: '6', label: '6+' },
  { value: '7', label: '7+' },
  { value: '8', label: '8+' },
  { value: '9', label: '9+' },
]
const MPA_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'G', label: 'G' },
  { value: 'PG', label: 'PG' },
  { value: 'PG-13', label: 'PG-13' },
  { value: 'R', label: 'R' },
  { value: 'NC-17', label: 'NC-17' },
]

function ratingOf(m: Movie): number {
  const n = typeof m.rating_average === 'number' ? m.rating_average : parseFloat(String(m.rating_average ?? '0'))
  return Number.isFinite(n) ? n : 0
}

/**
 * UI-only filter state for the My Favorites page, plus the client-side
 * filter/sort logic itself. Like useTheaterFilters/useMyReviewsFilters/
 * useMyOrdersFilters, this hook takes the already-fetched `movies` list
 * (from useMyFavorites) and returns the final `visibleMovies` directly,
 * so MyFavoritesPage doesn't need any filtering logic of its own --
 * following the RetailForge2 pattern (useMyFavoriteFilters takes
 * `products, categories, departments` and returns `visibleProducts`;
 * here it's `movies, genres` -> `visibleMovies`).
 *
 * Unlike useMovieFilters (which builds server query params for
 * MoviesPage's paginated/server-filtered listing), everything here runs
 * client-side over the movies the user has already favorited -- there's
 * no separate "Added" sort option since the fetched Movie objects don't
 * carry a `created_at` field (that's only meaningful as a server
 * `ordering` param, which this hook doesn't build).
 */
export function useMyFavoritesFilters(movies: Movie[] = [], genres: Genre[] = []) {
  const [q, setQ] = useState('')
  const [sortField, setSortField] = useState<FavoritesSortField>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [status, setStatus] = useState<'' | Availability>('')
  const [genreIds, setGenreIds] = useState<number[]>([])
  const [durationKey, setDurationKey] = useState<string>('any')
  const [ratingMin, setRatingMin] = useState<string>('')
  const [hasPoster, setHasPoster] = useState<boolean>(false)
  const [mpa, setMpa] = useState<MpaRating>('')

  /** Resets every filter (including the search text) back to its default. */
  const resetFilters = () => {
    setQ('')
    setSortField('title')
    setSortOrder('asc')
    setStatus('')
    setGenreIds([])
    setDurationKey('any')
    setRatingMin('')
    setHasPoster(false)
    setMpa('')
  }

  const visibleMovies = useMemo(() => {
    const [durMin, durMax] = DURATION_BOUNDS[durationKey] ?? [0, Infinity]
    const needle = q.trim().toLowerCase()

    const visible = movies.filter(m => {
      if (needle && !m.title.toLowerCase().includes(needle)) return false
      if (status && m.availability_status !== status) return false
      if (genreIds.length && !m.genres.some(g => genreIds.includes(g.id))) return false
      const dur = m.duration_minutes || 0
      if (dur < durMin || dur > durMax) return false
      if (ratingMin && ratingOf(m) < Number(ratingMin)) return false
      if (hasPoster && !(m.image_url || m.image)) return false
      if (mpa && m.mpa_rating !== mpa) return false
      return true
    })

    const multiplier = sortOrder === 'asc' ? 1 : -1
    visible.sort((a, b) => {
      if (sortField === 'title') return multiplier * a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      if (sortField === 'rating') return multiplier * (ratingOf(a) - ratingOf(b))
      if (sortField === 'duration') return multiplier * ((a.duration_minutes || 0) - (b.duration_minutes || 0))
      const at = a.release_date ? new Date(a.release_date).getTime() : 0
      const bt = b.release_date ? new Date(b.release_date).getTime() : 0
      return multiplier * (at - bt)
    })

    return visible
  }, [movies, q, status, genreIds, durationKey, ratingMin, hasPoster, mpa, sortField, sortOrder])

  const filterSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [
      { key: 'sort', title: 'Sort', type: 'radio', value: sortField, onChange: (v) => setSortField(v as FavoritesSortField), options: SORT_OPTIONS },
      { key: 'order', title: 'Order', type: 'radio', value: sortOrder, onChange: (v) => setSortOrder(v as 'asc' | 'desc'), options: ORDER_OPTIONS },
      { key: 'status', title: 'Series Status', type: 'radio', value: status, onChange: (v) => setStatus(v as '' | Availability), options: STATUS_OPTIONS },
      {
        key: 'tags', title: 'Tags', type: 'checkbox',
        values: genreIds.map(String),
        onChange: (vals) => setGenreIds((vals as string[]).map(Number)),
        options: genres.map(g => ({ value: String(g.id), label: g.name })),
      },
      { key: 'duration', title: 'Duration', type: 'radio', value: durationKey, onChange: (v) => setDurationKey(v as string), options: DURATION_OPTIONS },
      {
        key: 'poster', title: 'Poster', type: 'checkbox',
        values: hasPoster ? ['true'] : [],
        onChange: (v) => setHasPoster((v as string[]).includes('true')),
        options: [{ value: 'true', label: 'With poster' }],
      },
      { key: 'rating', title: 'Rating', type: 'radio', value: ratingMin || 'any', onChange: (v) => setRatingMin(v === 'any' ? '' : (v as string)), options: RATING_OPTIONS },
      { key: 'mpa', title: 'MPA Rating', type: 'radio', value: mpa, onChange: (v) => setMpa(v as MpaRating), options: MPA_OPTIONS },
    ]
    return sections
  }, [sortField, sortOrder, status, genreIds, durationKey, hasPoster, ratingMin, mpa, genres])

  return { q, setQ, filterSections, visibleMovies, resetFilters }
}
