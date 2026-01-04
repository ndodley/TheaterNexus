import { useEffect, useState } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import { api, imageUrl } from '../api'

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
    created_at: string
}

export default function OrderDetailsPage() {
    const [params] = useSearchParams()
    const { id: routeId } = useParams()
    const orderId = Number(params.get('order_id') || routeId || 0)
    const [order, setOrder] = useState<Order | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Loads the order data if available
    useEffect(() => {
        let active = true
        if (!orderId) return
        api.get(`/api/orders/${orderId}/`)
        .then(res => { if (active) setOrder(res.data) })
        .catch(err => { if (active) setError(err?.message ?? 'Failed to load order') })
        return () => { active = false }
    }, [orderId])

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
        <section className="container fade-in" style={{paddingTop:24, paddingBottom:24}}>
            <h2 style={{marginTop:0}}>Order #{orderId} Details</h2>
            {error && <div className="card">{error}</div>}
            {!error && !order && <div className="card">Finalizing your order…</div>}
            {order && ( 
                <div className="card"> 
                    <div>Order Status — <strong>{order.status.toUpperCase()}</strong></div>
                    <div>Order Date — <strong>{new Date(order.created_at).toLocaleString()}</strong></div>

                    {/* Per-showtime groups with movie details and seat chips */}
                    <div style={{ display:'flex', flexDirection:'column', gap: 14, marginTop: 12 }}>
                        {groups.map(({ key, items }) => {
                            const info = items[0]?.showtime_info || {}
                            const movieId = info.movie_id
                            const dt = info.start_time ? new Date(info.start_time) : null
                            const when = dt ? `${dt.toLocaleDateString()} • ${dt.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}` : ''
                            const groupTotal = items.reduce((acc, it) => acc + (typeof it.unit_price === 'number' ? it.unit_price : parseFloat(String(it.unit_price))), 0)
                            const content = (
                                <div className="card" style={{ display:'grid', gridTemplateColumns:'100px 1fr 140px', gap: 14, alignItems:'center' }}>
                                    <div>
                                        {info.movie_image ? (
                                            <img src={imageUrl(info.movie_image)} alt={info.movie_title || 'Poster'} style={{ width:'100%', height:130, objectFit:'cover', borderRadius:10 }} />
                                        ) : (
                                            <div className="card" style={{ height:130, display:'grid', placeItems:'center' }}>No image</div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ display:'flex', alignItems:'baseline', gap: 8 }}>
                                            <h3 style={{ margin:'0 0 4px 0' }}>{info.movie_title || 'Movie'}</h3>
                                            <span className="chip">Ticket ({items.length})</span>
                                        </div>
                                        <div style={{ opacity:0.85 }}>{info.theater_name || ''} {info.screen_name ? `• ${info.screen_name}` : ''}</div>
                                        {when && <div style={{ opacity:0.85 }}>{when}</div>}
                                        <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                                            {items.map(it => (
                                                <span key={it.id} className="chip" style={{ padding:'6px 10px', borderRadius:16, background:'#f3f4f6' }}>
                                                    {it.seat_label ?? it.seat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ textAlign:'right' }}>
                                        <div style={{ fontWeight:700, fontSize:18 }}>${groupTotal.toFixed(2)}</div>
                                    </div>
                                </div>
                            )
                            return (
                                <div key={key}>
                                    {movieId ? (
                                        <Link to={`/movies/${movieId}`} style={{ textDecoration:'none', color:'inherit', display:'block' }}>
                                            {content}
                                        </Link>
                                    ) : (
                                        content
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <div style={{marginTop:12}}>
                        <strong>Total:</strong> ${(
                            typeof order.total === 'number' ? order.total : parseFloat(String(order.total))
                        ).toFixed(2)} {order.currency.toUpperCase()}
                    </div>
                    <div style={{marginTop:16}}>
                        <Link to={'/orders'} className="btn">Go back</Link>
                    </div>
                </div>
            )}
        </section>
    )
}