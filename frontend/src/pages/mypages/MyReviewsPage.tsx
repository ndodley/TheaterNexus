import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMyReviews, deleteReview as deleteReviewApi } from '../../api/reviews'
import type { Review } from '../../types'
import { useAuth } from '../../auth/AuthContext'
import './MyReviewsPage.css'

export default function MyReviewsPage() {
  const { isAuthenticated } = useAuth()
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

  if (loading) return <section className="container"><div className="card">Loading…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container fade-in section-pad">
      <div className="myReviews-header">
        <h2 className="m-0">My Reviews</h2>
        <Link to="/movies">Browse Movies</Link>
      </div>
      {reviews.length === 0 && (
        <div className="card myReviews-emptyCard">You haven't posted any reviews yet.</div>
      )}
      {reviews.map(rv => (
        <div key={rv.id} className="card myReviews-item">
          <div className="myReviews-itemHeader">
            <div>
              <strong>{rv.movie_title}</strong>
              <div className="opacity-8">{new Date(rv.updated_at).toLocaleString()}</div>
            </div>
            <div>{'⭐'.repeat(Math.max(1, Math.min(5, rv.rating)))}</div>
          </div>
          {rv.title && <div className="myReviews-itemTitle">{rv.title}</div>}
          <p className="mt-8">{rv.content}</p>
          <div className="myReviews-actions">
            <Link to={`/movies/${rv.movie}`}><button className="btn-solid-primary">Edit on Movie</button></Link>
            <button onClick={() => deleteReview(rv.id)} className="btn-solid-muted">Delete</button>
          </div>
        </div>
      ))}
    </section>
  )
}
