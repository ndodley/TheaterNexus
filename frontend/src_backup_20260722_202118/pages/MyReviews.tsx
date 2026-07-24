import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { Review } from '../types'
import { useAuth } from '../auth/AuthContext'

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
        const { data } = await api.get('/api/reviews/me/')
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
      await api.delete(`/api/reviews/${reviewId}/`)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
    } catch (err: any) {
      alert(err?.message ?? 'Failed to delete review')
    }
  }

  if (loading) return <section className="container"><div className="card">Loading…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container fade-in" style={{paddingTop:24, paddingBottom:24}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <h2 style={{margin:0}}>My Reviews</h2>
        <Link to="/movies">Browse Movies</Link>
      </div>
      {reviews.length === 0 && (
        <div className="card" style={{padding:12}}>You haven't posted any reviews yet.</div>
      )}
      {reviews.map(rv => (
        <div key={rv.id} className="card" style={{padding:12, marginBottom:12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <strong>{rv.movie_title}</strong>
              <div style={{opacity:0.8}}>{new Date(rv.updated_at).toLocaleString()}</div>
            </div>
            <div>{'⭐'.repeat(Math.max(1, Math.min(5, rv.rating)))}</div>
          </div>
          {rv.title && <div style={{fontWeight:600, marginTop:8}}>{rv.title}</div>}
          <p style={{marginTop:8}}>{rv.content}</p>
          <div style={{display:'flex', gap:8}}>
            <Link to={`/movies/${rv.movie}`}><button style={{ backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}>Edit on Movie</button></Link>
            <button onClick={() => deleteReview(rv.id)} style={{ backgroundColor: '#eee', color: '#333' }}>Delete</button>
          </div>
        </div>
      ))}
    </section>
  )
}
