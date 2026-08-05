import { Link } from 'react-router-dom'
import { imageUrl } from '../../api'
import { useMyOrderDetails } from '../../hooks/orders/useMyOrders'
import type { OrderItem } from '../../hooks/orders/useMyOrders'
import '../../styles/orderItem.css'
import '../../styles/ticketChip.css'
import './MyOrderDetailsPage.css'

export default function OrderDetailsPage() {
    const { orderId, order, error } = useMyOrderDetails()

    // Group items by showtime for display
    const groups = (order?.items || []).reduce((acc: Array<{ key: string, items: OrderItem[] }>, it) => {
        const info = it.showtime_info || {}
        const key = [info.movie_title, info.start_time, info.screen_name, info.theater_name]
            .map(v => v ?? '')
            .join(' | ')
        const g = acc.find(x => x.key === key)
        if (g) g.items.push(it)
        else acc.push({ key, items: [it] })
        return acc
    }, [])

    return (
        <section className="container fade-in section-pad">
            <h2 className="mt-0">Order #{orderId} Details</h2>
            {error && <div className="card">{error}</div>}
            {!error && !order && <div className="card">Finalizing your order…</div>}
            {order && (
                <div className="card">
                    <div>Order Status — <strong>{order.status.toUpperCase()}</strong></div>
                    <div>Order Date — <strong>{new Date(order.created_at).toLocaleString()}</strong></div>

                    {/* Per-showtime groups with movie details and seat chips */}
                    <div className="order-itemsGroup">
                        {groups.map(({ key, items }) => {
                            const info = items[0]?.showtime_info || {}
                            const movieId = info.movie_id
                            const dt = info.start_time ? new Date(info.start_time) : null
                            const when = dt ? `${dt.toLocaleDateString()} • ${dt.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}` : ''
                            const groupTotal = items.reduce((acc, it) => acc + (typeof it.unit_price === 'number' ? it.unit_price : parseFloat(String(it.unit_price))), 0)
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
                        <Link to={'/orders'} className="btn">Go back</Link>
                    </div>
                </div>
            )}
        </section>
    )
}
