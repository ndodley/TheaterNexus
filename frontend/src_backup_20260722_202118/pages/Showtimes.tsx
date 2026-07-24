import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, imageUrl } from '../api'
import { Link, useNavigate } from 'react-router-dom'
import type { ShowTime } from '../types'

export default function ShowtimesPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ShowTime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [advOpen, setAdvOpen] = useState(false)
  const [q, setQ] = useState('')
  const [upcoming, setUpcoming] = useState(false)
  const [order, setOrder] = useState<'asc'|'desc'>('asc')
  const [timeRange, setTimeRange] = useState<'any'|'morning'|'afternoon'|'evening'>('any')
  const [mpa, setMpa] = useState<''|'G'|'PG'|'PG-13'|'R'|'NC-17'>('')
  const [openSort, setOpenSort] = useState(false)
  const [openTime, setOpenTime] = useState(false)
  const [openMpa, setOpenMpa] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  })

  useEffect(() => {
    let active = true
    setLoading(true)
    const params: any = { date: selectedDate }
    if (upcoming) params.upcoming = 'true'
    const rangeToFromTo = (date: string): { from?: string, to?: string } => {
      if (timeRange === 'any') return {}
      const startEnd: Record<string, [string, string]> = {
        morning: ['06:00:00', '12:00:00'],
        afternoon: ['12:00:00', '18:00:00'],
        evening: ['18:00:00', '23:59:00'],
      }
      const [s, e] = startEnd[timeRange]
      return { from: `${date}T${s}`, to: `${date}T${e}` }
    }
    const ft = rangeToFromTo(selectedDate)
    if (ft.from) params.from = ft.from
    if (ft.to) params.to = ft.to
    api.get('/api/showtimes/', { params })
      .then(res => { if (active) setItems(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load showtimes') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [selectedDate, upcoming, timeRange])

  useEffect(() => {
    let active = true
    api.get('/api/movies/', { params: { favorited: 'true', ordering: 'title' } })
      .then(res => { if (active) setFavoriteIds(new Set((res.data || []).map((m: any) => m.id))) })
      .catch(() => {})
    return () => { active = false }
  }, [])

  async function toggleFavorite(movieId: number) {
    try {
      if (favoriteIds.has(movieId)) {
        try {
          await api.delete(`/api/movies/${movieId}/favorite/`)
        } catch (err: any) {
          await api.post(`/api/movies/${movieId}/unfavorite/`)
        }
        setFavoriteIds(prev => { const next = new Set(prev); next.delete(movieId); return next })
      } else {
        await api.post(`/api/movies/${movieId}/favorite/`)
        setFavoriteIds(prev => { const next = new Set(prev); next.add(movieId); return next })
      }
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/login')
    }
  }

  // Group by movie -> theater for the selected date
  const groupedByMovie = useMemo(() => {
    type TheaterGroup = { name: string; times: ShowTime[] }
    const movies = new Map<number, { title: string; image?: string | null; duration?: number; rating?: number | string; theaters: Map<number, TheaterGroup> }>()
    for (const s of items) {
      // Client-side MPA filter by movie rating code
      if (mpa && s.movie_mpa_rating !== mpa) continue
      // Client-side search filter by movie or theater name
      if (q && !(`${s.movie_title} ${s.theater_name}`.toLowerCase().includes(q.toLowerCase()))) continue
      let mv = movies.get(s.movie)
      if (!mv) {
        mv = { title: s.movie_title, image: s.movie_image, duration: s.movie_duration_minutes, rating: s.movie_rating_average, theaters: new Map<number, TheaterGroup>() }
        movies.set(s.movie, mv)
      }
      if (mv && (mv.duration == null) && s.movie_duration_minutes != null) mv.duration = s.movie_duration_minutes
      if (mv && (mv.rating == null) && s.movie_rating_average != null) mv.rating = s.movie_rating_average
      let th = mv.theaters.get(s.theater)
      if (!th) {
        th = { name: s.theater_name, times: [] }
        mv.theaters.set(s.theater, th)
      }
      if (!th.times.find(x => x.id === s.id)) th.times.push(s)
    }
    for (const mv of movies.values()) {
      for (const th of mv.theaters.values()) {
        th.times.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      }
    }
    return movies
  }, [items, q])

  if (loading) return <section className="container"><div className="card">Loading showtimes…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container slide-up" style={{paddingTop:24, paddingBottom:24}}>
      <h2 style={{margin:'8px 0 16px'}}>Showtimes</h2>
      {/* Advanced search panel (matching Movies page styles) */}
      <div className="card adv-search-section" style={{marginBottom:12}}>
        <div className="adv-search">
          <div className="adv-toolbar">
            <div className="adv-input">
              <span className="icon">🔎</span>
              <input
                type="text"
                placeholder="Search movies or theaters…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button className="btn btn-ghost" onClick={() => setAdvOpen(v => !v)} aria-expanded={advOpen}>Filter</button>
            <button className="btn btn-primary" onClick={() => setSelectedDate(selectedDate)}>Search</button>
          </div>
          {advOpen && (
            <div className="adv-grid">
              <div className="adv-block">
                <div className="adv-block-header" onClick={() => setOpenSort(v => !v)}>
                  <span>Sort</span><span className="caret">▾</span>
                </div>
                {openSort && (
                  <div className="adv-block-body">
                    <div className="adv-row">
                      <label><input type="radio" name="order" checked={order==='asc'} onChange={() => setOrder('asc')} /> Ascending</label>
                      <label><input type="radio" name="order" checked={order==='desc'} onChange={() => setOrder('desc')} /> Descending</label>
                    </div>
                  </div>
                )}
              </div>
              <div className="adv-block">
                <div className="adv-block-header" onClick={() => setOpenTime(v => !v)}>
                  <span>Time</span><span className="caret">▾</span>
                </div>
                {openTime && (
                  <div className="adv-block-body">
                    <div className="adv-row">
                      <label><input type="radio" name="timeRange" checked={timeRange==='any'} onChange={() => setTimeRange('any')} /> Any</label>
                      <label><input type="radio" name="timeRange" checked={timeRange==='morning'} onChange={() => setTimeRange('morning')} /> Morning</label>
                      <label><input type="radio" name="timeRange" checked={timeRange==='afternoon'} onChange={() => setTimeRange('afternoon')} /> Afternoon</label>
                      <label><input type="radio" name="timeRange" checked={timeRange==='evening'} onChange={() => setTimeRange('evening')} /> Evening</label>
                    </div>
                    <div className="adv-row" style={{marginTop:8}}>
                      <label><input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} /> Upcoming only</label>
                    </div>
                  </div>
                )}
              </div>
              <div className="adv-block">
                <div className="adv-block-header" onClick={() => setOpenMpa(v => !v)}>
                  <span>MPA Rating</span><span className="caret">▾</span>
                </div>
                {openMpa && (
                  <div className="adv-block-body">
                    <div className="adv-row" style={{gridTemplateColumns:'1fr 1fr'}}>
                      <label><input type="radio" name="mpa" checked={mpa===''} onChange={() => setMpa('')} /> Any</label>
                      <label><input type="radio" name="mpa" checked={mpa==='G'} onChange={() => setMpa('G')} /> G</label>
                      <label><input type="radio" name="mpa" checked={mpa==='PG'} onChange={() => setMpa('PG')} /> PG</label>
                      <label><input type="radio" name="mpa" checked={mpa==='PG-13'} onChange={() => setMpa('PG-13')} /> PG-13</label>
                      <label><input type="radio" name="mpa" checked={mpa==='R'} onChange={() => setMpa('R')} /> R</label>
                      <label><input type="radio" name="mpa" checked={mpa==='NC-17'} onChange={() => setMpa('NC-17')} /> NC-17</label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {items.length === 0 && <div className="card">No upcoming showtimes yet.</div>}

      {/* Date tabs */}
      <div className="tabs" aria-label="Choose a date" style={{marginBottom:12}}>
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

      {items.length === 0 && <div className="card">No showtimes for this date.</div>}

      {Array.from(groupedByMovie.entries())
        .sort((a, b) => {
          const at = a[1].title.toLowerCase()
          const bt = b[1].title.toLowerCase()
          const cmp = at.localeCompare(bt)
          return order === 'asc' ? cmp : -cmp
        })
        .map(([movieId, mv]) => (
        <article
          key={movieId}
          className="card"
          style={{padding:16, marginBottom:16, cursor:'pointer'}}
          onClick={() => navigate(`/movies/${movieId}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/movies/${movieId}`) }}
        >
          <div className="media-grid">
            <div>
              {mv.image ? (
                <img src={imageUrl(mv.image)} alt={mv.title} style={{width:'100%', height:220, objectFit:'cover', borderRadius:12}} />
              ) : (
                <div className="card" style={{height:220, display:'grid', placeItems:'center'}}>No image</div>
              )}
            </div>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{margin:0}}>{mv.title}</h3>
                <button
                  className="btn btn-ghost"
                  title={favoriteIds.has(movieId) ? 'Remove from Favorites' : 'Add to Favorites'}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(movieId) }}
                  aria-label={favoriteIds.has(movieId) ? 'Unfavorite' : 'Favorite'}
                  style={{display:'flex', alignItems:'center', gap:6}}
                >
                  <span role="img" aria-label="favorite">{favoriteIds.has(movieId) ? '❤️' : '🤍'}</span>
                </button>
              </div>
              <div style={{marginTop:6, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
                {(() => {
                  const rv = typeof mv.rating === 'number' ? mv.rating : parseFloat((mv.rating as any) ?? '0')
                  const hasRating = !isNaN(rv)
                  const dur = mv.duration
                  const chips: ReactNode[] = []
                  // MPA rating chip
                  const sampleTime = Array.from(mv.theaters.values())[0]?.times[0]
                  const mpaCode = sampleTime?.movie_mpa_rating
                  if (mpaCode) chips.push(<span key="mpa" className="chip">{mpaCode}</span>)
                  if (hasRating) {
                    chips.push(<span key="rating" className="chip">Rating: {(rv as number).toFixed(1)}</span>)
                  }
                  if (typeof dur === 'number' && dur > 0) {
                    chips.push(<span key="duration" className="chip">Duration: {dur} min</span>)
                  }
                  return chips
                })()}
              </div>
              <div style={{marginTop:12, display:'grid', gap:10}}>
                {Array.from(mv.theaters.entries()).map(([theaterId, th]) => (
                  <div key={theaterId}>
                    <strong>{th.name}</strong>
                    {th.times[0]?.theater_address && (
                      <div style={{opacity:0.8, display:'flex', alignItems:'center', gap:6}}>
                        <span role="img" aria-label="Location">📍</span>
                        <span>{th.times[0].theater_address}</span>
                      </div>
                    )}
                    <div style={{marginTop:6, display:'flex', flexWrap:'wrap', gap:8}}>
                      {th.times.map(s => {
                        const start = new Date(s.start_time)
                        const end = s.end_time ? new Date(s.end_time) : null
                        const startStr = start.toLocaleTimeString([], { timeStyle: 'short' })
                        const endStr = end ? end.toLocaleTimeString([], { timeStyle: 'short' }) : ''
                        const label = typeof s.available_seat_count === 'number' ? `${startStr} · ${s.available_seat_count} seats` : startStr
                        return (
                          <Link key={s.id} to={`/showtimes/${s.id}/seats`} title={endStr ? `Ends ${endStr}` : undefined} onClick={(e) => e.stopPropagation()}>
                            <button className="time-chip" onClick={(e) => e.stopPropagation()}>{label}</button>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
