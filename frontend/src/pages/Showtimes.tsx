import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, imageUrl } from '../api'
import { Link } from 'react-router-dom'
import type { ShowTime } from '../types'

export default function ShowtimesPage() {
  const [items, setItems] = useState<ShowTime[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  })

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get('/api/showtimes/', { params: { date: selectedDate } })
      .then(res => { if (active) setItems(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load showtimes') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [selectedDate])

  // Group by movie -> theater for the selected date
  const groupedByMovie = useMemo(() => {
    type TheaterGroup = { name: string; times: ShowTime[] }
    const movies = new Map<number, { title: string; image?: string | null; theaters: Map<number, TheaterGroup> }>()
    for (const s of items) {
      let mv = movies.get(s.movie)
      if (!mv) {
        mv = { title: s.movie_title, image: s.movie_image, theaters: new Map<number, TheaterGroup>() }
        movies.set(s.movie, mv)
      }
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
  }, [items])

  if (loading) return <section className="container"><div className="card">Loading showtimes…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container slide-up" style={{paddingTop:24, paddingBottom:24}}>
      <h2 style={{margin:'8px 0 16px'}}>Showtimes</h2>
      {items.length === 0 && <div className="card">No upcoming showtimes yet.</div>}

      {/* Date tabs like on Movie Details */}
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

      {Array.from(groupedByMovie.entries()).map(([movieId, mv]) => (
        <article key={movieId} className="card" style={{padding:16, marginBottom:16}}>
          <div style={{display:'grid', gridTemplateColumns:'160px 1fr', gap:16}}>
            <div>
              {mv.image ? (
                <img src={imageUrl(mv.image)} alt={mv.title} style={{width:'100%', height:220, objectFit:'cover', borderRadius:12}} />
              ) : (
                <div className="card" style={{height:220, display:'grid', placeItems:'center'}}>No image</div>
              )}
            </div>
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                <h3 style={{margin:0}}>{mv.title}</h3>
                <Link to={`/movies/${movieId}`}><button style={{ backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}>Details</button></Link>
              </div>
              <div style={{marginTop:12, display:'grid', gap:10}}>
                {Array.from(mv.theaters.entries()).map(([theaterId, th]) => (
                  <div key={theaterId}>
                    <strong>{th.name}</strong>
                    <div style={{marginTop:6, display:'flex', flexWrap:'wrap', gap:8}}>
                      {th.times.map(s => {
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
            </div>
          </div>
        </article>
      ))}
    </section>
  )
}
