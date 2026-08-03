import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { imageUrl } from '../../api'
import { getMovie } from '../../api/movies'
import { getShowtimes } from '../../api/showtimes'
import { getMovieReviews, getMovieReviewSummary, createReview, updateReview, deleteReview as deleteReviewApi } from '../../api/reviews'
import type { Review, ReviewSummary, ShowTime } from '../../types'
import { useAuth } from '../../auth/AuthContext'
import { useFetch } from '../../hooks/useFetch'
import { useFavoriteToggle } from '../../hooks/useFavoriteToggle'
import '../../styles/dateTabs.css'
import '../../styles/showtimeCard.css'
import './MovieDetailsPage.css'

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { toggleFavorite: toggleFavoriteBase } = useFavoriteToggle()
  const { data: movie, setData: setMovie, error } = useFetch(
    () => getMovie(id as string).then(res => res.data),
    [id],
  )
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  })
  const [selectedTheater, setSelectedTheater] = useState<number | 'all'>('all')

  // Reviews state
  const { user, isAuthenticated } = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<ReviewSummary | null>(null)
  const [draftRating, setDraftRating] = useState<number>(5)
  const [draftTitle, setDraftTitle] = useState<string>('')
  const [draftContent, setDraftContent] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editRating, setEditRating] = useState<number>(5)
  const [editTitle, setEditTitle] = useState<string>('')
  const [editContent, setEditContent] = useState<string>('')

  async function toggleFavorite() {
    if (!id || !movie) return
    await toggleFavoriteBase(Number(id), movie.is_favorite, (next) => {
      setMovie(prev => prev ? { ...prev, is_favorite: next } : prev)
    })
  }

  const { data: showtimes = [] } = useFetch(() => {
    const params: Record<string, string> = { movie: String(id), date: selectedDate }
    if (selectedTheater !== 'all') params.theater = String(selectedTheater)
    return getShowtimes(params).then(res => res.data)
  }, [id, selectedDate, selectedTheater])

  // Load reviews list and summary
  useEffect(() => {
    if (!id) return
    getMovieReviews(id).then(res => setReviews(res.data)).catch(() => setReviews([]))
    getMovieReviewSummary(id).then(res => setSummary(res.data)).catch(() => setSummary({ movie_id: Number(id), average_rating: 0, count: 0 }))
  }, [id])

  async function refreshReviews() {
    if (!id) return
    const list = await getMovieReviews(id)
    setReviews(list.data)
    const s = await getMovieReviewSummary(id)
    setSummary(s.data)
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !isAuthenticated) return
    setSubmitting(true)
    try {
      await createReview(id, { rating: draftRating, title: draftTitle, content: draftContent })
      await refreshReviews()
      setDraftRating(5)
      setDraftTitle('')
      setDraftContent('')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteReview(reviewId: number) {
    if (!id || !isAuthenticated) return
    setSubmitting(true)
    try {
      await deleteReviewApi(reviewId)
      await refreshReviews()
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(rv: Review) {
    setEditingId(rv.id)
    setEditRating(rv.rating)
    setEditTitle(rv.title || '')
    setEditContent(rv.content || '')
  }

  async function saveEdit(reviewId: number) {
    if (!id || !isAuthenticated || !editingId) return
    setSubmitting(true)
    try {
      await updateReview(reviewId, { rating: editRating, title: editTitle, content: editContent })
      await refreshReviews()
      setEditingId(null)
    } finally {
      setSubmitting(false)
    }
  }

  const theaters = useMemo(() => {
    const map = new Map<number, string>()
    for (const s of showtimes) {
      map.set(s.theater, s.theater_name)
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [showtimes])

  // Group by theater, then by screen to avoid mixed and duplicate times
  const groupedByTheater = useMemo(() => {
    const grouped = new Map<number, Map<number, ShowTime[]>>()
    for (const s of showtimes) {
      let screens = grouped.get(s.theater)
      if (!screens) {
        screens = new Map<number, ShowTime[]>()
        grouped.set(s.theater, screens)
      }
      const arr = screens.get(s.screen) || []
      // Deduplicate by id within a screen
      if (!arr.find(x => x.id === s.id)) arr.push(s)
      // Sort by start time
      arr.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      screens.set(s.screen, arr)
    }
    return grouped
  }, [showtimes])

  if (error) return <section className="container"><div className="card">Error: {error}</div></section>
  if (!movie) return <section className="container"><div className="card">Loading…</div></section>

  return (
    <section className="container fade-in section-pad">
      <Link to="/movies" className="back-link">← Back to Movies</Link>
      <div className="card details-grid">
        {(movie.image_url || movie.image) && (
          <img src={imageUrl(movie.image_url || movie.image)} alt={movie.title} className="movieDetails-poster" />
        )}
        <div>
          <div className="showtimeCard-titleRow">
            <h2 className="mt-0">{movie.title}</h2>
            <button
              className="btn btn-ghost showtimeCard-favBtn"
              title={movie.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
              onClick={toggleFavorite}
              aria-label={movie.is_favorite ? 'Unfavorite' : 'Favorite'}
            >
              <span role="img" aria-label="favorite">{movie.is_favorite ? '❤️' : '🤍'}</span>
            </button>
          </div>
          <p className="opacity-9">{movie.plot_summary || 'No summary available.'}</p>
          <div className="movieDetails-genresRow">
            {movie.genres.map(g => <span key={g.id} className="badge">{g.name}</span>)}
          </div>
          {(() => {
            const ratingVal = (() => { const v = typeof movie.rating_average === 'number' ? movie.rating_average : parseFloat(movie.rating_average ?? '0'); return isNaN(v) ? null : v })()
            const releaseStr = movie.release_date ? (() => { const d = new Date(String(movie.release_date)); return isNaN(d.getTime()) ? movie.release_date : d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) })() : 'TBA'
            const availability = (movie.availability_status || '').replace(/_/g, ' ')
            return (
              <div className="kv-grid mt-16">
                <div className="kv-item">
                  <span className="kv-icon" aria-hidden>⏱️</span>
                  <div className="kv-content">
                    <small className="kv-label">Duration</small>
                    <div className="kv-value">{movie.duration_minutes} min</div>
                  </div>
                </div>
                <div className="kv-item">
                  <span className="kv-icon" aria-hidden>📅</span>
                  <div className="kv-content">
                    <small className="kv-label">Release Date</small>
                    <div className="kv-value">{releaseStr}</div>
                  </div>
                </div>
                <div className="kv-item">
                  <span className="kv-icon" aria-hidden>🎬</span>
                  <div className="kv-content">
                    <small className="kv-label">Availability</small>
                    <div className="kv-value movieDetails-capitalize">{availability || '—'}</div>
                  </div>
                </div>
                <div className="kv-item">
                  <span className="kv-icon" aria-hidden>⭐</span>
                  <div className="kv-content">
                    <small className="kv-label">Rating</small>
                    <div className="kv-value">{ratingVal === null ? 'N/A' : ratingVal.toFixed(1)}{summary ? ` • ${summary.count} review${summary.count === 1 ? '' : 's'}` : ''}</div>
                  </div>
                </div>
                <div className="kv-item">
                  <span className="kv-icon" aria-hidden>🔞</span>
                  <div className="kv-content">
                    <small className="kv-label">MPA Rating</small>
                    <div className="kv-value">{movie.mpa_rating || 'N/A'}</div>
                    {movie.mpa_rating_label ? <small className="kv-label">{movie.mpa_rating_label}</small> : null}
                  </div>
                </div>
              </div>
            )
          })()}
          <div className="mt-16">
            <Link to="/movies"><button className="btn-solid-primary">Back to Movies</button></Link>
          </div>
          <div className="mt-24">
            <h3 className="movieDetails-sectionHeading">Showtimes</h3>
            {/* Date tabs like Cinemark */}
            <div className="tabs" aria-label="Choose a date">
              {(() => {
                const out: ReactNode[] = []
                const pad = (n: number) => String(n).padStart(2, '0')
                const today = new Date()
                for (let i = 0; i < 10; i++) {
                  const d = new Date(today)
                  d.setDate(today.getDate() + i)
                  const value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
                  const weekday = d.toLocaleDateString([], { weekday: 'short' })
                  const mmdd = `${pad(d.getMonth()+1)}/${pad(d.getDate())}`
                  const isActive = selectedDate === value
                  out.push(
                    <button key={value} className={`tab-btn ${isActive ? 'active' : ''}`} onClick={() => setSelectedDate(value)}>
                      <div className="dateTab-label">{i === 0 ? 'Today' : weekday}</div>
                      <small>{mmdd}</small>
                    </button>
                  )
                }
                return out
              })()}
            </div>

            {/* Theater chips (optional filter), default All */}
            <div className="chip-row movieDetails-chipRow">
              <button className={`chip ${selectedTheater === 'all' ? 'active' : ''}`} onClick={() => setSelectedTheater('all')}>All Theaters</button>
              {theaters.map(t => (
                <button key={t.id} className={`chip ${selectedTheater === t.id ? 'active' : ''}`} onClick={() => setSelectedTheater(t.id)}>{t.name}</button>
              ))}
            </div>

            {theaters.length === 0 && <div className="card">No showtimes for this date.</div>}

            {theaters.map(t => {
              if (selectedTheater !== 'all' && t.id !== selectedTheater) return null
              const screens = groupedByTheater.get(t.id)
              const totalCount = screens ? Array.from(screens.values()).reduce((acc, arr) => acc + arr.length, 0) : 0
              return (
                <div key={t.id} className="card movieDetails-theaterCard">
                  <div className="flex-between-baseline">
                    <strong>{t.name}</strong>
                    <small className="opacity-8">{totalCount} showtime{totalCount === 1 ? '' : 's'}</small>
                  </div>
                  {/* Render each screen under the theater with its time chips */}
                  {screens && Array.from(screens.entries()).map(([screenId, arr]) => (
                    <div key={screenId} className="mt-8">
                      <div className="movieDetails-screenName">{arr[0]?.screen_name || 'Screen'}</div>
                      <div className="showtimeCard-timesRow">
                            {arr.map(s => {
                          const start = new Date(s.start_time)
                          const end = s.end_time ? new Date(s.end_time) : null
                          const startStr = start.toLocaleTimeString([], { timeStyle: 'short' })
                          const endStr = end ? end.toLocaleTimeString([], { timeStyle: 'short' }) : ''
                              return (
                                <Link key={s.id} to={`/showtimes/${s.id}/seats`} title={endStr ? `Ends ${endStr}` : undefined}>
                                  <button className="time-chip">{startStr}</button>
                                </Link>
                              )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          {/* Reviews Section */}
          <div className="mt-24">
            <h3 className="movieDetails-sectionHeading">Reviews</h3>
            {isAuthenticated ? (
              <form onSubmit={submitReview} className="card movieDetails-card12">
                <div className="movieDetails-fieldGrid">
                  <label htmlFor="rating"><strong>Rating</strong></label>
                  <select id="rating" value={draftRating} onChange={e => setDraftRating(parseInt(e.target.value))}>
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                  </select>
                  <label htmlFor="title"><strong>Title</strong></label>
                  <input id="title" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="Short headline" />
                  <label htmlFor="content"><strong>Review</strong></label>
                  <textarea id="content" value={draftContent} onChange={e => setDraftContent(e.target.value)} placeholder="Share your thoughts" rows={4} />
                </div>
                <div className="movieDetails-actionsRow">
                  <button type="submit" disabled={submitting} className="btn-solid-primary">
                    Post Review
                  </button>
                </div>
              </form>
            ) : (
              <div className="card movieDetails-card12">
                <div>Please log in to post a review.</div>
              </div>
            )}

            {reviews.length === 0 && <div className="card movieDetails-cardPad12">No reviews yet.</div>}
            {reviews.map(rv => (
              <div key={rv.id} className="card movieDetails-reviewCard">
                <div className="movieDetails-reviewHeader">
                  <strong>{rv.title || 'Untitled'}</strong>
                  <span>{'⭐'.repeat(Math.max(1, Math.min(5, rv.rating)))}</span>
                </div>
                <small className="opacity-8">
                  by {rv.user_email || rv.user_name} • {new Date(rv.created_at).toLocaleString()}
                  {rv.updated_at !== rv.created_at ? ` • edited ${new Date(rv.updated_at).toLocaleString()}` : ''}
                </small>
                <p className="mt-8">{rv.content}</p>
                {user && rv.user === user.id && (
                  <div className="movieDetails-editActionsRow">
                    <button onClick={() => startEdit(rv)} className="movieDetails-editBtn">Edit</button>
                    <button onClick={() => deleteReview(rv.id)} className="btn-solid-muted">Delete</button>
                  </div>
                )}
                {editingId === rv.id && (
                  <div className="card movieDetails-editCard">
                    <div className="movieDetails-fieldGrid">
                      <label><strong>Rating</strong></label>
                      <select value={editRating} onChange={e => setEditRating(parseInt(e.target.value))}>
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                      </select>
                      <label><strong>Title</strong></label>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                      <label><strong>Review</strong></label>
                      <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} />
                    </div>
                    <div className="movieDetails-editActionsRow">
                      <button onClick={() => saveEdit(rv.id)} disabled={submitting} className="movieDetails-saveBtn">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-solid-muted">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
