import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyReviews, deleteReview as deleteReviewApi } from '../../api/reviews'
import type { Review } from '../../types'

/**
 * The signed-in user's own reviews list fetch + delete, moved out of
 * MyReviewsPage as-is (including the redirect-to-login when signed out).
 */
export function useMyReviews(isAuthenticated: boolean) {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getMyReviews()
        setReviews(data)
      } catch (err: any) {
        setError(err?.message ?? 'Failed to load your reviews')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAuthenticated, navigate])

  async function deleteReview(reviewId: number) {
    if (!confirm('Delete this review?')) return
    try {
      await deleteReviewApi(reviewId)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (err: any) {
      alert(err?.message ?? 'Failed to delete review')
    }
  }

  return { reviews, loading, error, deleteReview }
}
