import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, imageUrl } from '../api'
import type { ShowTime, Seat } from '../types'
import { useAuth } from '../auth/AuthContext.tsx'

interface SeatsResponse {
  showtime: ShowTime
  seats: Seat[]
}

export default function SeatSelectionPage() {
  const { isAuthenticated } = useAuth()
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<SeatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (!id) return
    let active = true
    setLoading(true)
    api.get(`/api/showtimes/${id}/seats/`)
      .then(res => { if (active) setData(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load seats') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const rows = useMemo<[string, Seat[]][]>(() => {
    const out = new Map<string, Seat[]>()
    if (!data) return []
    for (const s of data.seats) {
      const arr = out.get(s.row) || []
      arr.push(s)
      out.set(s.row, arr)
    }
    out.forEach((arr) => arr.sort((a, b) => a.number - b.number))
    return Array.from(out.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [data])

  const toggle = (seat: Seat) => {
    if (!seat.is_available) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(seat.id)) next.delete(seat.id)
      else next.add(seat.id)
      return next
    })
  }

  const addSelectedToCart = async () => {
    if (!id) return
    if (!isAuthenticated) { window.location.href = '/login'; return }
    const showtimeId = Number(id)
    try {
      setSubmitting(true)
      setNotice(null)
      const seatIds = Array.from(selected)
      // Add each selected seat to cart; backend will refresh holds if already present
      for (const seatId of seatIds) {
        await api.post('/api/orders/cart/add/', { showtime_id: showtimeId, seat_id: seatId })
      }
      // Navigate to cart page
      window.location.href = '/cart'
    } catch (err) {
      const e: any = err as any
      const status = e?.response?.status
      if (status === 409) {
        setNotice('One or more seats were just taken. Please review availability and reselect.')
        try {
          const res = await api.get(`/api/showtimes/${id}/seats/`)
          setData(res.data)
          const availableIds = new Set<number>(res.data.seats.filter((s: Seat) => s.is_available && !s.is_paid).map((s: Seat) => s.id))
          setSelected(prev => new Set(Array.from(prev).filter(id => availableIds.has(id))))
        } catch {}
      } else {
        console.error('Failed to add to cart', err)
        setNotice('Failed to add to cart. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <section className="container"><div className="card">Loading seats…</div></section>
  if (error || !data) return <section className="container"><div className="card">{error || 'No data'}</div></section>

  const st = data.showtime
  const start = new Date(st.start_time)
  const timeStr = start.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  const basePrice = typeof st.base_price === 'number' ? st.base_price : parseFloat(String(st.base_price ?? '0'))
  const total = (selected.size * (isNaN(basePrice) ? 0 : basePrice)).toFixed(2)

  return (
    <section className="container fade-in" style={{paddingTop:24, paddingBottom:24}}>
      <Link to={"/showtimes"} style={{display:'inline-block', marginBottom:12}}>← Back to Showtimes</Link>
      <div className="card" style={{display:'grid', gridTemplateColumns:'260px 1fr', gap:18}}>
        <div>
          {st.movie_image ? (
            <img src={imageUrl(st.movie_image)} alt={st.movie_title} style={{width:'100%', height:320, objectFit:'cover', borderRadius:12, boxShadow:'var(--shadow)'}} />
          ) : (
            <div className="card" style={{height:320, display:'grid', placeItems:'center'}}>No image</div>
          )}
        </div>
        <div>
          <h2 style={{marginTop:0}}>{st.movie_title}</h2>
          <div style={{opacity:0.85}}>{st.theater_name} — {st.screen_name}</div>
          <div style={{marginTop:6}}>{timeStr}</div>

          <div style={{marginTop:16}}>
            <div className="legend" style={{display:'flex', alignItems:'center', gap:12, marginBottom:10}}>
              <span className="legend-item"><span className="legend-swatch unavailable"></span><small>Unavailable</small></span>
              <span className="legend-item"><span className="legend-swatch paid"></span><small>Paid</small></span>
              <span className="legend-item"><span className="legend-swatch available"></span><small>Available</small></span>
              <span className="legend-item"><span className="legend-swatch selected"></span><small>Selected</small></span>
            </div>
            <div className="card" style={{padding:14, overflowX:'auto'}}>
              <div className="screen-bar">Screen</div>
              {rows.map(([row, seats]: [string, Seat[]]) => (
                <div key={row} className="seat-row">
                  <div className="seat-row-label">{row}</div>
                  <div className="seat-grid">
                    {seats.map((seat: Seat) => {
                      const isSelected = selected.has(seat.id)
                      const isUnavailable = !seat.is_available
                      const isPaid = !!seat.is_paid
                      const title = `${seat.row}${seat.number} • ${seat.seat_type}`
                      const classes = ['seat']
                      if (isPaid) classes.push('is-paid')
                      else if (isUnavailable) classes.push('is-unavailable')
                      if (isSelected) classes.push('is-selected')
                      return (
                        <button
                          key={seat.id}
                          className={classes.join(' ')}
                          onClick={() => toggle(seat)}
                          disabled={isUnavailable || isPaid}
                          title={title}
                        />
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="summary-row" style={{marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div style={{display:'flex', gap:12, alignItems:'baseline'}}>
                <div><strong>{selected.size}</strong> seat{selected.size === 1 ? '' : 's'} selected</div>
                <div style={{opacity:0.85}}>Subtotal: <strong>${total}</strong></div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                {notice && <small className="chip" style={{background:'#fee', color:'#900'}}>{notice}</small>}
                <button onClick={addSelectedToCart} disabled={selected.size === 0 || submitting} style={{ backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}>{submitting ? 'Processing…' : 'Continue'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
