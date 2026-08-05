import { useParams, Link } from 'react-router-dom'
import { imageUrl } from '../../api/index.ts'
import type { Seat } from '../../types.ts'
import { useSeatSelection } from '../../hooks/showtimes/useSeatSelection.ts'
import './SeatSelectionPage.css'

export default function SeatSelectionPage() {
  const { id } = useParams<{ id: string }>()
  const {
    data,
    loading,
    error,
    rows,
    selected,
    toggle,
    notice,
    submitting,
    addSelectedToCart,
  } = useSeatSelection(id)

  if (loading) return <section className="container"><div className="card">Loading seats…</div></section>
  if (error || !data) return <section className="container"><div className="card">{error || 'No data'}</div></section>

  const st = data.showtime
  const start = new Date(st.start_time)
  const timeStr = start.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })
  const basePrice = typeof st.base_price === 'number' ? st.base_price : parseFloat(String(st.base_price ?? '0'))
  const total = (selected.size * (isNaN(basePrice) ? 0 : basePrice)).toFixed(2)

  return (
    <section className="container fade-in section-pad">
      <Link to={"/showtimes"} className="back-link">← Back to Showtimes</Link>
      <div className="card seatSelection-layout">
        <div>
          {st.movie_image ? (
            <img src={imageUrl(st.movie_image)} alt={st.movie_title} className="seatSelection-poster" />
          ) : (
            <div className="card seatSelection-posterPlaceholder">No image</div>
          )}
        </div>
        <div>
          <h2 className="seatSelection-title">{st.movie_title}</h2>
          <div className="seatSelection-meta">
            <span className="meta-pill"><span className="mi-icon" aria-hidden>📍</span>{st.theater_name}</span>
            <span className="meta-pill"><span className="mi-icon" aria-hidden>🎬</span>{st.screen_name}</span>
            <span className="meta-pill"><span className="mi-icon" aria-hidden>🕒</span>{timeStr}</span>
          </div>

          <div className="mt-16">
            <div className="legend">
              <span className="legend-item"><span className="legend-swatch unavailable"></span><small>Unavailable</small></span>
              <span className="legend-item"><span className="legend-swatch paid"></span><small>Paid</small></span>
              <span className="legend-item"><span className="legend-swatch available"></span><small>Available</small></span>
              <span className="legend-item"><span className="legend-swatch selected"></span><small>Selected</small></span>
            </div>
            <div className="card seatSelection-seatMapCard">
              <div className="screenIndicator">
                <span className="screenIndicator-label">Screen</span>
                <div className="screenIndicator-arc" />
              </div>
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
                        >
                          <span className="seat-number" aria-hidden>{seat.number}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="summary-row">
              <div className="seatSelection-summaryLeft">
                <div><strong>{selected.size}</strong> seat{selected.size === 1 ? '' : 's'} selected</div>
                <div className="opacity-85">Subtotal: <strong>${total}</strong></div>
              </div>
              <div className="seatSelection-summaryRight">
                {notice && <small className="chip seatSelection-noticeChip">{notice}</small>}
                <button onClick={addSelectedToCart} disabled={selected.size === 0 || submitting} className="btn-solid-primary">{submitting ? 'Processing…' : 'Continue'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
