import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { imageUrl } from '../api'
import { getOrder } from '../api/orders'
import '../styles/orderItem.css'
import '../styles/ticketChip.css'
import './Confirmation.css'

interface OrderItem {
  id: number
  showtime: number
  seat: number
  seat_label?: string
  unit_price: number | string
  showtime_info?: {
    movie_id?: number
    movie_title?: string
    movie_image?: string | null
    theater_name?: string
    screen_name?: string
    start_time?: string
  }
}

interface Order {
  id: number
  status: string
  currency: string
  subtotal: number | string
  fees: number | string
  tax: number | string
  total: number | string
  items: OrderItem[]
}

export default function ConfirmationPage() {
  const [params] = useSearchParams()
  const orderId = Number(params.get('order_id') || 0)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!orderId) return
    getOrder(orderId)
      .then(res => { if (active) setOrder(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load order') })
    return () => { active = false }
  }, [orderId])

  return (
    <section className="container fade-in section-pad">
      <h2 className="mt-0">Payment Successful</h2>
      {error && <div className="card">{error}</div>}
      {!error && !order && <div className="card">Finalizing your order…</div>}
      {order && (
        <div className="card">
          <div>Order #{order.id} — <strong>{order.status.toUpperCase()}</strong></div>

          {/* Group items per showtime to mirror Order Details layout */}
          <div className="order-itemsGroup">
            {(order.items || []).reduce((acc: Array<{ key: string, items: OrderItem[] }>, it) => {
              const info = it.showtime_info || {}
              const key = [info.movie_title, info.start_time, info.screen_name, info.theater_name]
                .map(v => v ?? '')
                .join(' | ')
              const g = acc.find(x => x.key === key)
              if (g) g.items.push(it)
              else acc.push({ key, items: [it] })
              return acc
            }, []).map(({ key, items }) => {
              const info = items[0]?.showtime_info || {}
              const dt = info.start_time ? new Date(info.start_time) : null
              const when = dt ? `${dt.toLocaleDateString()} • ${dt.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}` : ''
              const groupTotal = items.reduce((acc, it) => acc + (typeof it.unit_price === 'number' ? it.unit_price : parseFloat(String(it.unit_price))), 0)
              const movieId = info.movie_id
              const content = (
                <div className="card order-itemRow">
                  <div>
                    {info.movie_image ? (
                      <img src={imageUrl(info.movie_image)} alt={info.movie_title || 'Poster'} className="order-itemPoster" />
                    ) : (
                      <div className="card order-itemPosterPlaceholder">No image</div>
                    )}
                  </div>
                  <div>
                    <div className="order-itemTitleRow">
                      <h3 className="order-itemTitle">{info.movie_title || 'Movie'}</h3>
                      <span className="chip">Ticket ({items.length})</span>
                    </div>
                    <div className="opacity-85">{info.theater_name || ''} {info.screen_name ? `• ${info.screen_name}` : ''}</div>
                    {when && <div className="opacity-85">{when}</div>}
                    <div className="order-itemChips">
                      {items.map(it => (
                        <span key={it.id} className="chip ticket-chip">
                          {it.seat_label ?? it.seat}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="order-itemPrice">
                    <div className="order-itemPriceValue">${groupTotal.toFixed(2)}</div>
                  </div>
                </div>
              )
              return (
                <div key={key}>
                  {movieId ? (
                    <Link to={`/movies/${movieId}`} className="order-itemLink">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-12">
            <strong>Total:</strong> ${(
              typeof order.total === 'number' ? order.total : parseFloat(String(order.total))
            ).toFixed(2)} {order.currency.toUpperCase()}
          </div>
          <div className="mt-16">
            <Link to={'/orders'} className="btn">View Order History</Link>
          </div>
        </div>
      )}
    </section>
  )
}
