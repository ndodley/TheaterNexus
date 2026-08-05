import { useFetch } from '../useFetch'
import { fetchFavoriteMovies } from '../../api/favorites'

/**
 * Fetches the signed-in user's favorited movies via the dedicated
 * favorites API (api/favorites.ts), instead of reaching into
 * api/movies.ts's getMovies({ favorited: 'true' }) the way
 * MyFavoritesPage used to (through useMovieFilters + useMovies).
 *
 * Mirrors RetailForge2's hooks/favorites/useMyFavorites.ts: fetch the
 * favorited list once, then hand it to useMyFavoritesFilters for
 * client-side filtering/sorting -- no server round-trip per filter
 * change, unlike the Movies listing page.
 */
export function useMyFavorites() {
  const { data: movies = [], setData: setMovies, loading, initialLoading, error, refetch } = useFetch(
    () => fetchFavoriteMovies(),
    [],
    { errorFallback: 'Failed to load favorites' },
  )

  return { movies, setMovies, loading, initialLoading, error, refetch }
}
