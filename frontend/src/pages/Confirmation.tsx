import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { api } from '../api'

interface OrderItem {
  id: number
  showtime: number
  seat: number
  seat_label?: string
  unit_price: number | string
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
    api.get(`/api/orders/${orderId}/`)
      .then(res => { if (active) setOrder(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load order') })
    return () => { active = false }
  }, [orderId])

  return (
    <section className="container fade-in" style={{paddingTop:24, paddingBottom:24}}>
      <h2 style={{marginTop:0}}>Payment Successful</h2>
      {error && <div className="card">{error}</div>}
      {!error && !order && <div className="card">Finalizing your order…</div>}
      {order && (
        <div className="card">
          <div>Order #{order.id} — <strong>{order.status.toUpperCase()}</strong></div>
          <ul style={{listStyle:'none', padding:0}}>
            {order.items.map(it => (
              <li key={it.id} className="card" style={{marginTop:8, display:'flex', justifyContent:'space-between'}}>
                <div>Seat: {it.seat_label ?? it.seat}</div>
                <div>${(typeof it.unit_price === 'number' ? it.unit_price : parseFloat(String(it.unit_price))).toFixed(2)}</div>
              </li>
            ))}
          </ul>
          <div style={{marginTop:12}}>
            <strong>Total:</strong> ${(
              typeof order.total === 'number' ? order.total : parseFloat(String(order.total))
            ).toFixed(2)} {order.currency.toUpperCase()}
          </div>
          <div style={{marginTop:16}}>
            <Link to={'/orders'} className="btn">View Order History</Link>
          </div>
        </div>
      )}
    </section>
  )
}
