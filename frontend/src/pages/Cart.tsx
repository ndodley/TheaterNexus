import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api, imageUrl } from '../api'

interface ShowtimeInfo { movie_title: string; movie_image?: string | null; theater_name: string; screen_name: string; start_time: string }

interface CartItem {
  id: number
  showtime: number
  seat: number
  seat_label: string
  unit_price: number | string
  hold_expires_at: string
  showtime_info?: ShowtimeInfo | null
}

interface Cart {
  id: number
  status: string
  expires_at?: string | null
  created_at: string
  items: CartItem[]
}

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get('/api/orders/cart/')
      .then(res => { if (active) setCart(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load cart') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const removeItem = async (itemId: number) => {
    try {
      const res = await api.delete(`/api/orders/cart/remove/${itemId}/`)
      setCart(res.data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to remove item')
    }
  }

  const subtotal = (cart?.items || []).reduce((acc, it) => acc + (typeof it.unit_price === 'number' ? it.unit_price : parseFloat(String(it.unit_price))), 0)

  const groups = useMemo(() => {
    const map = new Map<number, { info: ShowtimeInfo | null; items: CartItem[] }>()
    for (const it of (cart?.items || [])) {
      const g = map.get(it.showtime) || { info: it.showtime_info || null, items: [] }
      g.items.push(it)
      if (!g.info && it.showtime_info) g.info = it.showtime_info
      map.set(it.showtime, g)
    }
    return Array.from(map.entries())
  }, [cart])

  if (loading) return <section className="container"><div className="card">Loading cart…</div></section>
  if (error) return <section className="container"><div className="card">{error}</div></section>

  return (
    <section className="container fade-in" style={{paddingTop:24, paddingBottom:24}}>
      <h2 style={{marginTop:0}}>Shopping Cart</h2>
      {/* Header summary like Cinemark */}
      <div className="card" style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 18px', marginBottom:16}}>
        <div style={{fontWeight:700}}>{(cart?.items?.length || 0)} Item{(cart?.items?.length||0)===1?'':'s'} in Cart</div>
        <button className="btn primary" disabled={!cart || cart.items.length===0} onClick={() => navigate('/checkout')} style={{minWidth:160}}>Checkout</button>
      </div>

      {(!cart || cart.items.length === 0) ? (
        <div className="card" style={{opacity:0.9}}>Your cart is empty. <Link to="/showtimes">Find showtimes</Link></div>
      ) : (
        <>
          <div className="card" style={{marginBottom:12}}><strong>Order Summary</strong></div>
          {groups.map(([showtimeId, group]) => {
            const info = group.info
            const groupTotal = group.items.reduce((acc, it) => acc + (typeof it.unit_price === 'number' ? it.unit_price : parseFloat(String(it.unit_price))), 0)
            const dt = info?.start_time ? new Date(info.start_time) : null
            const timeStr = dt ? dt.toLocaleString([], { timeStyle: 'short', dateStyle: 'medium' }) : ''
            const seatList = group.items.map(i => i.seat_label).join(', ')
            return (
              <div key={showtimeId} className="card" style={{display:'grid', gridTemplateColumns:'120px 1fr 140px', gap:18, alignItems:'center', marginBottom:14}}>
                <div>
                  {info?.movie_image ? (
                    <img src={imageUrl(info.movie_image)} alt={info.movie_title} style={{width:'100%', height:150, objectFit:'cover', borderRadius:12}} />
                  ) : (
                    <div className="card" style={{height:150, display:'grid', placeItems:'center'}}>No image</div>
                  )}
                </div>
                <div>
                  <div style={{display:'flex', alignItems:'baseline', gap:10}}>
                    <h3 style={{margin:'0 0 4px 0'}}>{info?.movie_title || 'Movie'}</h3>
                    <span className="chip">Ticket ({group.items.length})</span>
                  </div>
                  <div style={{opacity:0.85}}>{info?.theater_name} — {info?.screen_name}</div>
                  <div style={{marginTop:6}}>{timeStr}</div>
                  <div style={{marginTop:10}}>
                    <div style={{opacity:0.85}}><small>Seats: {seatList}</small></div>
                    <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
                      {group.items.map(it => (
                        <button key={it.id} className="chip" title={`Remove ${it.seat_label}`} onClick={() => removeItem(it.id)}>
                          {it.seat_label} ✕
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontWeight:700, fontSize:18}}>${groupTotal.toFixed(2)}</div>
                </div>
              </div>
            )
          })}

          {/* Upsell card */}
          <div className="card" style={{display:'grid', gridTemplateColumns:'64px 1fr 160px', alignItems:'center', gap:18, margin:'8px 0 16px'}}>
            <div style={{fontSize:32}}>🍿</div>
            <div>
              <div style={{fontWeight:700}}>Don't forget the co-stars</div>
              <div style={{opacity:0.85}}>Grab snacks now and skip the line. Add concessions while you checkout.</div>
            </div>
            <div style={{textAlign:'right'}}>
              <button className="btn">Add Some Snacks</button>
            </div>
          </div>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</div>
            <button className="btn primary" onClick={() => navigate('/checkout')} style={{minWidth:160}}>Checkout</button>
          </div>
        </>
      )}
    </section>
  )
}
