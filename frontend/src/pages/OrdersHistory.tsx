import { useEffect, useState } from 'react'
import { api } from '../api'
import { Link } from 'react-router-dom'

interface OrderItem { id: number; seat_label?: string; unit_price: number | string }
interface Order {
  id: number
  status: string
  currency: string
  total: number | string
  created_at: string
  items: OrderItem[]
}

export default function OrdersHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get('/api/orders/')
      .then(res => { if (active) setOrders(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load orders') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) return <section className="container"><div className="card">Loading orders…</div></section>
  if (error) return <section className="container"><div className="card">{error}</div></section>

  return (
    <section className="container fade-in" style={{paddingTop:24, paddingBottom:24}}>
      <h2 style={{marginTop:0}}>My Orders</h2>
      {orders.length === 0 ? (
        <div className="card">No orders yet. <Link to={'/showtimes'}>Find showtimes</Link></div>
      ) : (
        <ul style={{listStyle:'none', padding:0}}>
          {orders.map(o => (
            <li key={o.id} className="card" style={{marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div><strong>Order #{o.id}</strong> — {new Date(o.created_at).toLocaleString()}</div>
                <div style={{opacity:0.85}}>Status: {o.status.toUpperCase()}</div>
              </div>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <div><strong>${(typeof o.total === 'number' ? o.total : parseFloat(String(o.total))).toFixed(2)}</strong> {o.currency.toUpperCase()}</div>
                <Link to={`/orders/orderdetails?order_id=${o.id}`} className="btn btn-secondary">Details</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
