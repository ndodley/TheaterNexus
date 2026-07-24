import { api } from './client'
import type { Review, ReviewSummary } from '../types'

export function getMovieReviews(movieId: number | string) {
  return api.get<Review[]>(`/api/reviews/movies/${movieId}/`)
}

export function getMovieReviewSummary(movieId: number | string) {
  return api.get<ReviewSummary>(`/api/reviews/movies/${movieId}/summary/`)
}

export function createReview(movieId: number | string, payload: { rating: number; title: string; content: string }) {
  return api.post(`/api/reviews/movies/${movieId}/`, payload)
}

export function updateReview(reviewId: number, payload: { rating: number; title: string; content: string }) {
  return api.put(`/api/reviews/${reviewId}/`, payload)
}

export function deleteReview(reviewId: number) {
  return api.delete(`/api/reviews/${reviewId}/`)
}

export function getMyReviews() {
  return api.get<Review[]>('/api/reviews/me/')
}
