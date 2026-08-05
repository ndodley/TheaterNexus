import { useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { imageUrl } from '../../api'
import { useAuth } from '../../auth/AuthContext'
import { useMovie } from '../../hooks/movies/useMovies'
import { useMovieShowtimes } from '../../hooks/showtimes/useMovieShowtimes'
import { useReviews } from '../../hooks/reviews/useReviews'
import { usePagination } from '../../hooks/usePagination'
import '../../styles/dateTabs.css'
import '../../styles/showtimeCard.css'
import '../../styles/pagination.css'
import './MovieDetailsPage.css'

const REVIEWS_PAGE_SIZE = 4

function StarPicker({ value, onChange, size = 24 }: { value: number; onChange: (n: number) => void; size?: number }) {
  return (
    <div className="starPicker" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`starPicker-star ${n <= value ? 'is-filled' : ''}`}
          style={{ fontSize: size }}
          onClick={() => onChange(n)}
          aria-pressed={n === value}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
        >★</button>
      ))}
    </div>
  )
}

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const { movie, error, toggleFavorite } = useMovie(id)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  })
  const [selectedTheater, setSelectedTheater] = useState<number | 'all'>('all')
  const { theaters, groupedByTheater } = useMovieShowtimes(id, selectedDate, selectedTheater)

  const { user, isAuthenticated } = useAuth()
  const {
    reviews,
    summary,
    draftRating, setDraftRating,
    draftTitle, setDraftTitle,
    draftContent, setDraftContent,
    submitting,
    editingId,
    editRating, setEditRating,
    editTitle, setEditTitle,
    editContent, setEditContent,
    submitReview,
    deleteReview,
    startEdit,
    saveEdit,
    cancelEdit,
  } = useReviews(id, isAuthenticated)
  const { setPage: setReviewsPage, safePage: reviewsSafePage, totalPages: reviewsTotalPages, pagedItems: pagedReviews } = usePagination(reviews, REVIEWS_PAGE_SIZE)

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
          <div className="mt-24 movieDetails-showtimesBlock">
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
          <div className="mt-24 movieDetails-reviewsBlock">
            <h3 className="movieDetails-sectionHeading">Reviews</h3>
            {isAuthenticated ? (
              <form onSubmit={submitReview} className="card movieDetails-composerCard">
                <div className="movieDetails-composerHeading">Write a review</div>
                <div className="movieDetails-fieldGrid">
                  <div className="movieDetails-field">
                    <label><strong>Your rating</strong></label>
                    <StarPicker value={draftRating} onChange={setDraftRating} />
                  </div>
                  <div className="movieDetails-field">
                    <label htmlFor="title"><strong>Title</strong></label>
                    <input id="title" type="text" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="Short headline" />
                  </div>
                  <div className="movieDetails-field movieDetails-field--full">
                    <label htmlFor="content"><strong>Review</strong></label>
                    <textarea id="content" value={draftContent} onChange={e => setDraftContent(e.target.value)} placeholder="Share your thoughts" rows={4} />
                  </div>
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

            {reviews.length > 0 && (
              <div className="pagination-bar">
                <small className="opacity-7">
                  Showing {(reviewsSafePage - 1) * REVIEWS_PAGE_SIZE + 1}-{Math.min(reviewsSafePage * REVIEWS_PAGE_SIZE, reviews.length)} of {reviews.length}
                </small>
                <div className="pagination-controls">
                  <button type="button" className="btn btn-ghost" disabled={reviewsSafePage <= 1} onClick={() => setReviewsPage(p => p - 1)}>Prev</button>
                  <span className="pagination-pageIndicator">Page {reviewsSafePage} / {reviewsTotalPages}</span>
                  <button type="button" className="btn btn-ghost" disabled={reviewsSafePage >= reviewsTotalPages} onClick={() => setReviewsPage(p => p + 1)}>Next</button>
                </div>
              </div>
            )}

            {pagedReviews.map(rv => {
              const clampedRating = Math.max(1, Math.min(5, rv.rating))
              const initial = (rv.user_email || rv.user_name || '?').charAt(0).toUpperCase()
              return (
                <div key={rv.id} className="card movieDetails-reviewCard">
                  <div className="movieDetails-reviewAvatar" aria-hidden>{initial}</div>
                  <div className="movieDetails-reviewBody">
                    <div className="movieDetails-reviewHeader">
                      <strong>{rv.title || 'Untitled'}</strong>
                      <span className="movieDetails-reviewStars" aria-label={`${clampedRating} out of 5 stars`}>
                        {'★'.repeat(clampedRating)}<span className="movieDetails-reviewStarsEmpty">{'★'.repeat(5 - clampedRating)}</span>
                      </span>
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
                          <div className="movieDetails-field">
                            <label><strong>Your rating</strong></label>
                            <StarPicker value={editRating} onChange={setEditRating} size={20} />
                          </div>
                          <div className="movieDetails-field">
                            <label><strong>Title</strong></label>
                            <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                          </div>
                          <div className="movieDetails-field movieDetails-field--full">
                            <label><strong>Review</strong></label>
                            <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} />
                          </div>
                        </div>
                        <div className="movieDetails-editActionsRow">
                          <button onClick={() => saveEdit(rv.id)} disabled={submitting} className="movieDetails-saveBtn">Save</button>
                          <button onClick={cancelEdit} className="btn-solid-muted">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
