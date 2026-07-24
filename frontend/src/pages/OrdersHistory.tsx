import { getOrders } from '../api/orders'
import { Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import './OrdersHistory.css'

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
  const { data: orders = [], loading, error } = useFetch<Order[]>(
    () => getOrders().then(res => res.data),
    [],
    { errorFallback: 'Failed to load orders' },
  )

  if (loading) return <section className="container"><div className="card">Loading orders…</div></section>
  if (error) return <section className="container"><div className="card">{error}</div></section>

  return (
    <section className="container fade-in section-pad">
      <h2 className="mt-0">My Orders</h2>
      {orders.length === 0 ? (
        <div className="card">No orders yet. <Link to={'/showtimes'}>Find showtimes</Link></div>
      ) : (
        <ul className="ordersHistory-list">
          {orders.map(o => (
            <li key={o.id} className="card ordersHistory-row">
              <div>
                <div><strong>Order #{o.id}</strong> — {new Date(o.created_at).toLocaleString()}</div>
                <div className="opacity-85">Status: {o.status.toUpperCase()}</div>
              </div>
              <div className="ordersHistory-rowRight">
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
