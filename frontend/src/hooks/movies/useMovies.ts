import { useFetch } from '../useFetch'
import { useFavoriteToggle } from '../useFavoriteToggle'
import { getGenres, getMovie, getMovies } from '../../api/movies'

/**
 * All movie-fetching hooks in one file -- useMovies (the filtered listing
 * used by MoviesPage/MyFavoritesPage), useMovie (a single movie + its
 * favorite toggle, used by MovieDetailsPage), useHomeMovies (the home
 * page's featured list), and useGenres (the genre reference list used to
 * build the movie filters' "Tags" section). Merged together (previously
 * four separate files) since each was only a handful of lines wrapping
 * the same useFetch/getMovies(-ish) primitives -- one file is easier to
 * scan than four near-identical small ones.
 *
 * `useGenres` stays a separate function (not folded into `useMovies`'s
 * own fetch) so `useMovieFilters` can keep receiving `genres` as a plain
 * argument, exactly like RetailForge2's useMyFavoriteFilters takes
 * categories/departments -- decoupled from whatever `params` the movie
 * listing itself is fetching with.
 */

/**
 * Fetches a movie list (by whatever `params` the caller's filter hook
 * produces, e.g. useMovieFilters). Shared by MoviesPage and
 * MyFavoritesPage -- they differ only in `params` (Favorites pins
 * `favorited: 'true'`) and in `errorFallback`.
 *
 * `liveParamsKey` (useMovieFilters' stable digest of every filter except
 * the free-text search box) drives the underlying useFetch call's deps
 * array, so toggling a radio/checkbox filter auto-refetches through
 * useFetch's own effect -- which runs AFTER the state update has
 * flushed, so it never reads a stale params object. The free-text search
 * still only refetches on Search/Enter (wired to the returned `refetch`),
 * so typing doesn't fire a request per keystroke.
 */
export function useMovies(
  params: Record<string, string>,
  liveParamsKey?: string,
  options?: { errorFallback?: string },
) {
  const { data: movies = [], setData: setMovies, loading, initialLoading, error, refetch } = useFetch(
    () => getMovies(params).then(res => res.data),
    [liveParamsKey],
    options,
  )

  return { movies, setMovies, loading, initialLoading, error, refetch }
}

/**
 * Fetches a single movie by id and wraps useFavoriteToggle so the caller
 * gets a ready-to-bind toggleFavorite() that patches the local movie
 * state in place, mirroring the previous inline logic in
 * MovieDetailsPage.
 */
export function useMovie(id: string | undefined) {
  const { data: movie, setData: setMovie, error } = useFetch(
    () => getMovie(id as string).then(res => res.data),
    [id],
  )
  const { toggleFavorite: toggleFavoriteBase } = useFavoriteToggle()

  async function toggleFavorite() {
    if (!id || !movie) return
    await toggleFavoriteBase(Number(id), movie.is_favorite, (next) => {
      setMovie(prev => prev ? { ...prev, is_favorite: next } : prev)
    })
  }

  return { movie, setMovie, error, toggleFavorite }
}

/**
 * HomePage's featured-movies fetch. Wraps getMovies() via useFetch, same
 * as useMovies() does for the listing pages -- HomePage just doesn't need
 * the genres list or a filter params object.
 */
export function useHomeMovies() {
  const { data: movies = [], loading, error } = useFetch(() => getMovies().then(res => res.data), [])
  return { movies, loading, error }
}

/**
 * Fetches the genre reference list used to build the movie filters'
 * "Tags" section.
 */
export function useGenres() {
  const { data: genres = [] } = useFetch(() => getGenres().then(res => res.data), [])
  return { genres }
}
