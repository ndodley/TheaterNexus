import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, imageUrl } from '../api'
import type { Movie, ShowTime, Review, ReviewSummary } from '../types'
import { useAuth } from '../auth/AuthContext'

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showtimes, setShowtimes] = useState<ShowTime[]>([])
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

  useEffect(() => {
    if (!id) return
    api.get(`/api/movies/${id}/`).then(res => setMovie(res.data)).catch(err => setError(err?.message ?? 'Failed to load'))
  }, [id])

  useEffect(() => {
    if (!id) return
    const params: Record<string, string> = { movie: String(id), date: selectedDate }
    if (selectedTheater !== 'all') params.theater = String(selectedTheater)
    api.get('/api/showtimes/', { params })
      .then(res => setShowtimes(res.data))
      .catch(() => {})
  }, [id, selectedDate, selectedTheater])

  // Load reviews list and summary
  useEffect(() => {
    if (!id) return
    api.get(`/api/reviews/movies/${id}/`).then(res => setReviews(res.data)).catch(() => setReviews([]))
    api.get(`/api/reviews/movies/${id}/summary/`).then(res => setSummary(res.data)).catch(() => setSummary({ movie_id: Number(id), average_rating: 0, count: 0 }))
  }, [id])


  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !isAuthenticated) return
    setSubmitting(true)
    try {
      const payload = { rating: draftRating, title: draftTitle, content: draftContent }
      await api.post(`/api/reviews/movies/${id}/`, payload)
      const list = await api.get(`/api/reviews/movies/${id}/`)
      setReviews(list.data)
      const s = await api.get(`/api/reviews/movies/${id}/summary/`)
      setSummary(s.data)
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
      await api.delete(`/api/reviews/${reviewId}/`)
      const list = await api.get(`/api/reviews/movies/${id}/`)
      setReviews(list.data)
      const s = await api.get(`/api/reviews/movies/${id}/summary/`)
      setSummary(s.data)
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
      const payload = { rating: editRating, title: editTitle, content: editContent }
      await api.put(`/api/reviews/${reviewId}/`, payload)
      const list = await api.get(`/api/reviews/movies/${id}/`)
      setReviews(list.data)
      const s = await api.get(`/api/reviews/movies/${id}/summary/`)
      setSummary(s.data)
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
    <section className="container fade-in" style={{paddingTop: 24, paddingBottom: 24}}>
      <Link to="/movies" style={{display:'inline-block', marginBottom:12}}>← Back to Movies</Link>
      <div className="card" style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:24}}>
        {(movie.image_url || movie.image) && (
          <img src={imageUrl(movie.image_url || movie.image)} alt={movie.title} style={{width:'100%', height:360, objectFit:'cover', borderRadius:12}} />
        )}
        <div>
          <h2 style={{marginTop:0}}>{movie.title}</h2>
          <p style={{opacity:0.9}}>{movie.plot_summary || 'No summary available.'}</p>
          <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap'}}>
            {movie.genres.map(g => <span key={g.id} className="badge">{g.name}</span>)}
          </div>
          <div style={{marginTop:16, display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:12}}>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Duration</small>
              <div>{movie.duration_minutes} min</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Release Date</small>
              <div>{movie.release_date || 'TBA'}</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Availability</small>
              <div>{movie.availability_status.replace('_',' ')}</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Rating</small>
              <div>
                {(() => { const val = typeof movie.rating_average === 'number' ? movie.rating_average : parseFloat(movie.rating_average ?? '0'); return isNaN(val) ? 'N/A' : val.toFixed(1) })()} average
                {summary ? ` • ${summary.count} review${summary.count === 1 ? '' : 's'}` : ''}
              </div>
            </div>
          </div>
          <div style={{marginTop:16}}>
            <Link to="/movies"><button style={{ backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}>Back to Movies</button></Link>
          </div>
          <div style={{marginTop:24}}>
            <h3 style={{margin:'0 0 8px'}}>Showtimes</h3>
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
                      <div style={{fontWeight: isActive ? 800 : 600}}>{i === 0 ? 'Today' : weekday}</div>
                      <small>{mmdd}</small>
                    </button>
                  )
                }
                return out
              })()}
            </div>

            {/* Theater chips (optional filter), default All */}
            <div className="chip-row" style={{margin:'12px 0'}}>
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
                <div key={t.id} className="card" style={{padding:12, marginBottom:12}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                    <strong>{t.name}</strong>
                    <small style={{opacity:0.8}}>{totalCount} showtime{totalCount === 1 ? '' : 's'}</small>
                  </div>
                  {/* Render each screen under the theater with its time chips */}
                  {screens && Array.from(screens.entries()).map(([screenId, arr]) => (
                    <div key={screenId} style={{marginTop:8}}>
                      <div style={{fontWeight:600, opacity:0.9}}>{arr[0]?.screen_name || 'Screen'}</div>
                      <div style={{marginTop:6, display:'flex', flexWrap:'wrap', gap:8}}>
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
          <div style={{marginTop:24}}>
            <h3 style={{margin:'0 0 8px'}}>Reviews</h3>
            {isAuthenticated ? (
              <form onSubmit={submitReview} className="card" style={{padding:12, marginBottom:12}}>
                <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:12, alignItems:'center'}}>
                  <label htmlFor="rating"><strong>Rating</strong></label>
                  <select id="rating" value={draftRating} onChange={e => setDraftRating(parseInt(e.target.value))}>
                    {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                  </select>
                  <label htmlFor="title"><strong>Title</strong></label>
                  <input id="title" value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="Short headline" />
                  <label htmlFor="content"><strong>Review</strong></label>
                  <textarea id="content" value={draftContent} onChange={e => setDraftContent(e.target.value)} placeholder="Share your thoughts" rows={4} />
                </div>
                <div style={{marginTop:12, display:'flex', gap:8}}>
                  <button type="submit" disabled={submitting} style={{ backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}>
                    Post Review
                  </button>
                </div>
              </form>
            ) : (
              <div className="card" style={{padding:12, marginBottom:12}}>
                <div>Please log in to post a review.</div>
              </div>
            )}

            {reviews.length === 0 && <div className="card" style={{padding:12}}>No reviews yet.</div>}
            {reviews.map(rv => (
              <div key={rv.id} className="card" style={{padding:12, marginBottom:8}}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <strong>{rv.title || 'Untitled'}</strong>
                  <span>{'⭐'.repeat(Math.max(1, Math.min(5, rv.rating)))}</span>
                </div>
                <small style={{opacity:0.8}}>
                  by {rv.user_email || rv.user_name} • {new Date(rv.created_at).toLocaleString()}
                  {rv.updated_at !== rv.created_at ? ` • edited ${new Date(rv.updated_at).toLocaleString()}` : ''}
                </small>
                <p style={{marginTop:8}}>{rv.content}</p>
                {user && rv.user === user.id && (
                  <div style={{display:'flex', gap:8, marginTop:8}}>
                    <button onClick={() => startEdit(rv)} style={{ backgroundColor: '#eef', color: '#333' }}>Edit</button>
                    <button onClick={() => deleteReview(rv.id)} style={{ backgroundColor: '#eee', color: '#333' }}>Delete</button>
                  </div>
                )}
                {editingId === rv.id && (
                  <div className="card" style={{padding:12, marginTop:8}}>
                    <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:12, alignItems:'center'}}>
                      <label><strong>Rating</strong></label>
                      <select value={editRating} onChange={e => setEditRating(parseInt(e.target.value))}>
                        {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} ⭐</option>)}
                      </select>
                      <label><strong>Title</strong></label>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                      <label><strong>Review</strong></label>
                      <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} />
                    </div>
                    <div style={{marginTop:8, display:'flex', gap:8}}>
                      <button onClick={() => saveEdit(rv.id)} disabled={submitting} style={{ backgroundColor: 'var(--primary)', color: '#fff' }}>Save</button>
                      <button onClick={() => setEditingId(null)} style={{ backgroundColor: '#eee', color: '#333' }}>Cancel</button>
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
