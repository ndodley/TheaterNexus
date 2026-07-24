import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { imageUrl } from '../api'
import { getTheater } from '../api/theaters'
import { getShowtimes } from '../api/showtimes'
import { getMovies } from '../api/movies'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ShowTime } from '../types'
import { useFetch } from '../hooks/useFetch'
import { useFavoriteToggle } from '../hooks/useFavoriteToggle'
import AdvancedSearchPanel, { AdvancedSearchBlock } from '../components/AdvancedSearchPanel'
import '../styles/dateTabs.css'
import './TheaterShowtimes.css'
import '../styles/mediaGrid.css'
import '../styles/showtimeCard.css'

export default function TheaterShowtimesPage() {
  const navigate = useNavigate()
  const { toggleFavorite: toggleFavoriteBase } = useFavoriteToggle()
  const { id } = useParams()
  const theaterId = Number(id)

  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [q, setQ] = useState('')
  const [upcoming, setUpcoming] = useState(false)
  const [order, setOrder] = useState<'asc'|'desc'>('asc')
  const [timeRange, setTimeRange] = useState<'any'|'morning'|'afternoon'|'evening'>('any')
  const [mpa, setMpa] = useState<''|'G'|'PG'|'PG-13'|'R'|'NC-17'>('')
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  })

  const { data, loading, error } = useFetch(() => {
    const params: any = { theater: theaterId, date: selectedDate }
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
    return Promise.all([
      getTheater(theaterId),
      getShowtimes(params),
    ]).then(([thRes, stRes]) => ({ theater: thRes.data, items: stRes.data }))
  }, [theaterId, selectedDate, upcoming, timeRange], { errorFallback: 'Failed to load theater showtimes' })
  const theater = data?.theater ?? null
  const items = data?.items ?? []

  useFetch(
    () => getMovies({ favorited: 'true', ordering: 'title' }).then(res => {
      setFavoriteIds(new Set((res.data || []).map((m: any) => m.id)))
      return res.data
    }),
    [],
  )

  async function toggleFavorite(movieId: number) {
    await toggleFavoriteBase(movieId, favoriteIds.has(movieId), (next) => {
      setFavoriteIds(prev => {
        const nextSet = new Set(prev)
        if (next) nextSet.add(movieId)
        else nextSet.delete(movieId)
        return nextSet
      })
    })
  }

  // Group by movie for the selected date
  const groupedByMovie = useMemo(() => {
    const movies = new Map<number, { title: string; image?: string | null; duration?: number; rating?: number | string; times: ShowTime[] }>()
    for (const s of items) {
      // Client-side MPA filter by movie rating code
      if (mpa && s.movie_mpa_rating !== mpa) continue
      if (q && !(`${s.movie_title}`.toLowerCase().includes(q.toLowerCase()))) continue
      let mv = movies.get(s.movie)
      if (!mv) {
        mv = { title: s.movie_title, image: s.movie_image, duration: s.movie_duration_minutes, rating: s.movie_rating_average, times: [] }
        movies.set(s.movie, mv)
      }
      if (mv && (mv.duration == null) && s.movie_duration_minutes != null) mv.duration = s.movie_duration_minutes
      if (mv && (mv.rating == null) && s.movie_rating_average != null) mv.rating = s.movie_rating_average
      mv.times.push(s)
    }
    for (const mv of movies.values()) {
      mv.times.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      if (order === 'desc') mv.times.reverse()
    }
    return movies
  }, [items, q])


  if (loading) return <section className="container"><div className="card">Loading theater showtimes…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container slide-up section-pad">
      <div className="flex-between-baseline">
        <h2 className="theaterShowtimes-heading">{theater?.name || 'Theater'}</h2>
      </div>
      {theater?.address && (
        <div className="theaterShowtimes-address">
          <span role="img" aria-label="Location">📍</span>
          <span>{theater.address}</span>
        </div>
      )}

      {/* Date tabs */}
      <div className="tabs tabs--gapped" aria-label="Choose a date">
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

      {items.length === 0 && <div className="card">No showtimes for this date.</div>}

      {/* Advanced search panel (matching Movies page styles) */}
      <AdvancedSearchPanel
        searchValue={q}
        onSearchChange={setQ}
        onSearch={() => setSelectedDate(selectedDate)}
        placeholder="Search movies…"
        gapped
      >
        <AdvancedSearchBlock label="Sort">
          <div className="adv-row">
            <label><input type="radio" name="order" checked={order==='asc'} onChange={() => setOrder('asc')} /> Ascending</label>
            <label><input type="radio" name="order" checked={order==='desc'} onChange={() => setOrder('desc')} /> Descending</label>
          </div>
        </AdvancedSearchBlock>
        <AdvancedSearchBlock label="Time">
          <div className="adv-row">
            <label><input type="radio" name="timeRange" checked={timeRange==='any'} onChange={() => setTimeRange('any')} /> Any</label>
            <label><input type="radio" name="timeRange" checked={timeRange==='morning'} onChange={() => setTimeRange('morning')} /> Morning</label>
            <label><input type="radio" name="timeRange" checked={timeRange==='afternoon'} onChange={() => setTimeRange('afternoon')} /> Afternoon</label>
            <label><input type="radio" name="timeRange" checked={timeRange==='evening'} onChange={() => setTimeRange('evening')} /> Evening</label>
          </div>
          <div className="adv-row mt-8">
            <label><input type="checkbox" checked={upcoming} onChange={(e) => setUpcoming(e.target.checked)} /> Upcoming only</label>
          </div>
        </AdvancedSearchBlock>
        <AdvancedSearchBlock label="MPA Rating">
          <div className="adv-row">
            <label><input type="radio" name="mpa" checked={mpa===''} onChange={() => setMpa('')} /> Any</label>
            <label><input type="radio" name="mpa" checked={mpa==='G'} onChange={() => setMpa('G')} /> G</label>
            <label><input type="radio" name="mpa" checked={mpa==='PG'} onChange={() => setMpa('PG')} /> PG</label>
            <label><input type="radio" name="mpa" checked={mpa==='PG-13'} onChange={() => setMpa('PG-13')} /> PG-13</label>
            <label><input type="radio" name="mpa" checked={mpa==='R'} onChange={() => setMpa('R')} /> R</label>
            <label><input type="radio" name="mpa" checked={mpa==='NC-17'} onChange={() => setMpa('NC-17')} /> NC-17</label>
          </div>
        </AdvancedSearchBlock>
      </AdvancedSearchPanel>
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
          className="card showtimeCard-article"
          onClick={() => navigate(`/movies/${movieId}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/movies/${movieId}`) }}
        >
          <div className="media-grid">
            <div>
              {mv.image ? (
                <img src={imageUrl(mv.image)} alt={mv.title} className="showtimeCard-poster" />
              ) : (
                <div className="card showtimeCard-posterPlaceholder">No image</div>
              )}
            </div>
            <div>
              <div className="showtimeCard-titleRow">
                <h3 className="m-0">{mv.title}</h3>
                <button
                  className="btn btn-ghost showtimeCard-favBtn"
                  title={favoriteIds.has(movieId) ? 'Remove from Favorites' : 'Add to Favorites'}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(movieId) }}
                  aria-label={favoriteIds.has(movieId) ? 'Unfavorite' : 'Favorite'}
                >
                  <span role="img" aria-label="favorite">{favoriteIds.has(movieId) ? '❤️' : '🤍'}</span>
                </button>
              </div>
              <div className="showtimeCard-chipsRow">
                {(() => {
                  const rv = typeof mv.rating === 'number' ? mv.rating : parseFloat((mv.rating as any) ?? '0')
                  const hasRating = !isNaN(rv)
                  const dur = mv.duration
                  const chips: ReactNode[] = []
                  // MPA rating chip
                  const sampleTime = mv.times?.[0]
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
              <div className="mt-12">
                <strong>{theater?.name}</strong>
                <div className="showtimeCard-timesRow">
                  {mv.times.map(s => {
                    const start = new Date(s.start_time)
                    const end = s.end_time ? new Date(s.end_time) : null
                    const startStr = start.toLocaleTimeString([], { timeStyle: 'short' })
                    const endStr = end ? end.toLocaleTimeString([], { timeStyle: 'short' }) : ''
                    const label = s.available_seat_count != null ? `${startStr} · ${s.available_seat_count} seats` : startStr
                    return (
                      <Link key={s.id} to={`/showtimes/${s.id}/seats`} title={endStr ? `Ends ${endStr}` : undefined} onClick={(e) => e.stopPropagation()}>
                        <button className="time-chip" onClick={(e) => e.stopPropagation()}>{label}</button>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
