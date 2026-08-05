import { useMemo, useState } from 'react'
import type { Availability, Genre } from '../../types'
import type { FilterSection } from '../../components/AdvancedSearchPanel'

export type MpaRating = '' | 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17'

const SORT_OPTIONS = [
  { value: 'release_date', label: 'Release Date' },
  { value: 'rating_average', label: 'Rating' },
  { value: 'title', label: 'Title' },
  { value: 'duration_minutes', label: 'Duration' },
  { value: 'created_at', label: 'Added' },
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
// Duration is a bucketed radio -- each option sets BOTH durationMin/
// durationMax at once, so the section's own `value` is a synthetic bucket
// key derived from the current min/max, not one of the raw state fields.
const DURATION_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'le90', label: '≤ 90 min' },
  { value: '91to120', label: '91–120 min' },
  { value: '121to150', label: '121–150 min' },
  { value: 'ge151', label: '≥ 151 min' },
]
const DURATION_BOUNDS: Record<string, [string, string]> = {
  any: ['', ''],
  le90: ['', '90'],
  '91to120': ['91', '120'],
  '121to150': ['121', '150'],
  ge151: ['151', ''],
}
// Same bucketed-radio shape as Duration: each option sets ratingMin (and
// always clears ratingMax, matching the original behavior).
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

/**
 * The "advanced search" filter state for a movie listing, shared byte-for-
 * byte between MoviesPage and MyFavoritesPage (only the base query params
 * differ -- Favorites pins `favorited: 'true'`). Extracted so both pages
 * share one implementation instead of two copies of the same fields.
 * (Renamed from usePublicMovieFilters -- shorter, and matches the file
 * name like the other `use*Filters` hooks.)
 *
 * Following the RetailForge2 pattern: every filter's UI definition (which
 * blocks, which options, radio vs. checkbox) lives here as a declarative
 * `filterSections` array, not as hand-written JSX on the page -- editing a
 * filter (adding an option, renaming a label, changing a bucket) means
 * editing this file, not MoviesPage.tsx/MyFavoritesPage.tsx. Boolean
 * filters (like "Poster") are modeled as a single-option checkbox
 * section, matching AdvancedSearchPanel's real (RetailForge2) shape,
 * which has no dedicated toggle type.
 *
 * `genres` (fetched separately by useGenres -- see that file for why)
 * seeds the "Tags" section's options. `baseParams` lets a page seed fixed
 * params (e.g. `{ favorited: 'true' }`) that always ride along with
 * whatever the user has filtered/sorted by.
 *
 * `mpa` is returned directly (in addition to living in `filterSections`)
 * because it's the one filter applied client-side, after the fetch -- the
 * backend has no mpa_rating query param -- so the page still needs the
 * raw value to filter its fetched `movies` list itself.
 */
export function useMovieFilters(genres: Genre[] = [], baseParams: Record<string, string> = {}) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'' | Availability>('')
  const [genreIds, setGenreIds] = useState<number[]>([])
  const [durationMin, setDurationMin] = useState<string>('')
  const [durationMax, setDurationMax] = useState<string>('')
  const [ratingMin, setRatingMin] = useState<string>('')
  const [ratingMax, setRatingMax] = useState<string>('')
  const [hasPoster, setHasPoster] = useState<boolean>(false)
  const [sortField, setSortField] = useState<string>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [mpa, setMpa] = useState<MpaRating>('')

  const params = useMemo(() => {
    const p: Record<string, string> = { ...baseParams }
    if (q.trim()) p.search = q.trim() // DRF SearchFilter uses ?search=
    if (status) p.status = status
    if (genreIds.length) p.genre_ids = genreIds.join(',')
    if (durationMin) p.duration_min = durationMin
    if (durationMax) p.duration_max = durationMax
    if (ratingMin) p.rating_min = ratingMin
    if (ratingMax) p.rating_max = ratingMax
    if (hasPoster) p.has_poster = 'true'
    const ordering = (sortOrder === 'desc' ? '-' : '') + (sortField || 'release_date')
    p.ordering = ordering
    return p
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, genreIds, durationMin, durationMax, ratingMin, ratingMax, hasPoster, sortField, sortOrder])

  /**
   * Stable key covering every filter EXCEPT the free-text `q`. Passed as a
   * page's `useMovies(params, liveParamsKey)` second argument so radio/
   * checkbox filters (status, genres, duration, rating, poster, sort)
   * auto-refetch the moment they change, via useFetch's own effect --
   * `q` is deliberately excluded so typing doesn't fire a request per
   * keystroke; it still applies when the user hits Search or Enter.
   */
  const liveParamsKey = useMemo(
    () => JSON.stringify({ status, genreIds, durationMin, durationMax, ratingMin, ratingMax, hasPoster, sortField, sortOrder }),
    [status, genreIds, durationMin, durationMax, ratingMin, ratingMax, hasPoster, sortField, sortOrder],
  )

  /** Resets every filter (including the search text and MPA rating) back to its default. */
  const resetFilters = () => {
    setQ('')
    setStatus('')
    setGenreIds([])
    setDurationMin('')
    setDurationMax('')
    setRatingMin('')
    setRatingMax('')
    setHasPoster(false)
    setSortField('title')
    setSortOrder('asc')
    setMpa('')
  }

  const durationKey =
    durationMin === '' && durationMax === '' ? 'any' :
    durationMax === '90' ? 'le90' :
    durationMin === '91' && durationMax === '120' ? '91to120' :
    durationMin === '121' && durationMax === '150' ? '121to150' :
    durationMin === '151' ? 'ge151' : 'any'

  const ratingKey = ratingMin === '' ? 'any' : ratingMin

  const filterSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [
      { key: 'sort', title: 'Sort', type: 'radio', value: sortField, onChange: (v) => setSortField(v as string), options: SORT_OPTIONS },
      { key: 'order', title: 'Order', type: 'radio', value: sortOrder, onChange: (v) => setSortOrder(v as 'asc' | 'desc'), options: ORDER_OPTIONS },
      { key: 'status', title: 'Series Status', type: 'radio', value: status, onChange: (v) => setStatus(v as '' | Availability), options: STATUS_OPTIONS },
      {
        key: 'tags', title: 'Tags', type: 'checkbox',
        values: genreIds.map(String),
        onChange: (vals) => setGenreIds((vals as string[]).map(Number)),
        options: genres.map(g => ({ value: String(g.id), label: g.name })),
      },
      {
        key: 'duration', title: 'Duration', type: 'radio',
        value: durationKey,
        onChange: (v) => {
          const [min, max] = DURATION_BOUNDS[v as string] ?? ['', '']
          setDurationMin(min)
          setDurationMax(max)
        },
        options: DURATION_OPTIONS,
      },
      {
        key: 'poster', title: 'Poster', type: 'checkbox',
        values: hasPoster ? ['true'] : [],
        onChange: (v) => setHasPoster((v as string[]).includes('true')),
        options: [{ value: 'true', label: 'With poster' }],
      },
      {
        key: 'rating', title: 'Rating', type: 'radio',
        value: ratingKey,
        onChange: (v) => {
          const val = v as string
          setRatingMin(val === 'any' ? '' : val)
          setRatingMax('')
        },
        options: RATING_OPTIONS,
      },
      { key: 'mpa', title: 'MPA Rating', type: 'radio', value: mpa, onChange: (v) => setMpa(v as MpaRating), options: MPA_OPTIONS },
    ]
    return sections
  }, [sortField, sortOrder, status, genreIds, durationKey, hasPoster, ratingKey, mpa, genres])

  return { q, setQ, mpa, params, liveParamsKey, filterSections, resetFilters }
}
