import { useNavigate } from 'react-router-dom'
import { setMovieFavorite } from '../api/movies'

/**
 * Encapsulates the favorite/unfavorite toggle logic that used to be
 * duplicated (near byte-for-byte) across Movies, Favorites, MovieDetails,
 * Showtimes and TheaterShowtimes: POST .../favorite/ to add, DELETE
 * (falling back to POST .../unfavorite/) to remove, and redirect to /login
 * on a 401.
 *
 * Each page still owns its own local state shape (a flag on one movie, or a
 * Set of favorited ids), so the caller supplies `onToggled` to apply the
 * update however that page needs to.
 */
export function useFavoriteToggle() {
  const navigate = useNavigate()

  async function toggleFavorite(
    movieId: number,
    isFavorite: boolean | undefined,
    onToggled: (nextFavorite: boolean) => void,
  ) {
    try {
      const next = !isFavorite
      await setMovieFavorite(movieId, next)
      onToggled(next)
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/login')
    }
  }

  return { toggleFavorite }
}
