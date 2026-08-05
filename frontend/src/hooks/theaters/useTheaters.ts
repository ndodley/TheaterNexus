import { useParams } from 'react-router-dom'
import { useFetch } from '../useFetch'
import { getTheater, getTheaters } from '../../api/theaters'

/**
 * Both theater-fetching hooks in one file -- useTheaters (the full list,
 * used by TheatersPage) and useTheater (a single theater by route param,
 * used by TheaterShowtimesPage). Merged together (previously two
 * separate files) since each was only a handful of lines wrapping the
 * same useFetch/getTheaters(-single) primitives.
 */

/**
 * Fetches the full theater list once on mount. `items` is passed into
 * useTheaterFilters(items), which owns the client-side filter/sort logic
 * itself and returns the final `visibleTheaters`.
 */
export function useTheaters() {
  const { data: items = [], loading, error } = useFetch(
    () => getTheaters().then(res => res.data),
    [],
    { errorFallback: 'Failed to load theaters' },
  )

  return { items, loading, error }
}

/**
 * Fetches the single theater identified by the `id` route param. Owns
 * the `useParams` read so callers just get a ready-to-use `theaterId`
 * alongside the fetched theater.
 */
export function useTheater() {
  const { id } = useParams()
  const theaterId = Number(id)

  const { data: theater = null, loading, error } = useFetch(
    () => getTheater(theaterId).then(res => res.data),
    [theaterId],
  )

  return { theaterId, theater, loading, error }
}
