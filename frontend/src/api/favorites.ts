import axios from 'axios'
import { api } from './client'
import type { Movie } from '../types'

/**
 * Dedicated favorites API, mirroring RetailForge2's `api/favorites.ts`
 * shape (fetch / add / remove + a shared error-message helper), adapted
 * to TheaterNexus's real movie-favoriting endpoints.
 *
 * One deliberate difference from RetailForge2: that project passes a
 * `userId` explicitly in every URL (`/api/favorites/user/:userId/...`).
 * TheaterNexus's backend instead infers the current user from the auth
 * token that AuthContext attaches to every request, so none of these
 * functions take a userId.
 *
 * This file is additive -- `setMovieFavorite` in `api/movies.ts` (used by
 * `hooks/useFavoriteToggle.ts`, which every page's favorite-star button
 * goes through) is untouched, so existing favorite-toggle behavior is
 * unchanged. New code can import from here instead when a dedicated
 * favorites API is a better fit than reaching into `api/movies.ts`.
 */

export interface FavoriteDto {
  movieId: number
}

/** Fetches the current user's favorited movies (same request MyFavoritesPage's `useMovieFilters(genres, { favorited: 'true' })` makes). */
export async function fetchFavoriteMovies() {
  const { data } = await api.get<Movie[]>('/api/movies/', { params: { favorited: 'true' } })
  return data
}

/** Convenience wrapper over `fetchFavoriteMovies` for callers that only need the ids. */
export async function fetchFavoriteMovieIds() {
  const movies = await fetchFavoriteMovies()
  return movies.map(m => m.id)
}

export async function addFavorite(movieId: number | string) {
  await api.post(`/api/movies/${movieId}/favorite/`)
}

/**
 * Mirrors the previous inline pattern used across pages: unfavoriting
 * tries DELETE first and falls back to POST .../unfavorite/ if DELETE is
 * blocked.
 */
export async function removeFavorite(movieId: number | string) {
  try {
    await api.delete(`/api/movies/${movieId}/favorite/`)
  } catch {
    await api.post(`/api/movies/${movieId}/unfavorite/`)
  }
}

export function getFavoriteApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}
