import { api } from './client'
import type { Movie, Genre } from '../types'

export function getMovies(params?: Record<string, string>) {
  return api.get<Movie[]>('/api/movies/', { params })
}

export function getMovie(id: number | string) {
  return api.get<Movie>(`/api/movies/${id}/`)
}

export function getGenres() {
  return api.get<Genre[]>('/api/genres/')
}

/**
 * Sets or clears a movie's favorite flag.
 * Mirrors the previous inline pattern used across pages: unfavoriting tries
 * DELETE first and falls back to POST .../unfavorite/ if DELETE is blocked.
 */
export async function setMovieFavorite(movieId: number | string, favorite: boolean) {
  if (favorite) {
    await api.post(`/api/movies/${movieId}/favorite/`)
  } else {
    try {
      await api.delete(`/api/movies/${movieId}/favorite/`)
    } catch {
      await api.post(`/api/movies/${movieId}/unfavorite/`)
    }
  }
}
