import { useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { imageUrl } from '../../api'
import { getCart, removeCartItem } from '../../api/orders'
import { useFetch } from '../../hooks/useFetch'
import './CartPage.css'

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
  const navigate = useNavigate()
  const { data: cart, setData: setCart, loading, error, setError } = useFetch<Cart>(
    () => getCart().then(res => res.data),
    [],
    { errorFallback: 'Failed to load cart' },
  )

  const removeItem = async (itemId: number) => {
    try {
      const res = await removeCartItem(itemId)
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
    <section className="container fade-in section-pad">
      <h2 className="mt-0">Shopping Cart</h2>
      {/* Header summary like Cinemark */}
      <div className="card cart-summaryBar">
        <div className="cart-summaryCount">{(cart?.items?.length || 0)} Item{(cart?.items?.length||0)===1?'':'s'} in Cart</div>
        <button className="btn primary cart-checkoutBtn" disabled={!cart || cart.items.length===0} onClick={() => navigate('/checkout')}>Checkout</button>
      </div>

      {(!cart || cart.items.length === 0) ? (
        <div className="card cart-emptyCard">Your cart is empty. <Link to="/showtimes">Find showtimes</Link></div>
      ) : (
        <>
          <div className="card mb-12"><strong>Order Summary</strong></div>
          {groups.map(([showtimeId, group]) => {
            const info = group.info
            const groupTotal = group.items.reduce((acc, it) => acc + (typeof it.unit_price === 'number' ? it.unit_price : parseFloat(String(it.unit_price))), 0)
            const dt = info?.start_time ? new Date(info.start_time) : null
            const timeStr = dt ? dt.toLocaleString([], { timeStyle: 'short', dateStyle: 'medium' }) : ''
            const seatList = group.items.map(i => i.seat_label).join(', ')
            return (
              <div key={showtimeId} className="card cart-itemRow">
                <div>
                  {info?.movie_image ? (
                    <img src={imageUrl(info.movie_image)} alt={info.movie_title} className="cart-itemPoster" />
                  ) : (
                    <div className="card cart-itemPosterPlaceholder">No image</div>
                  )}
                </div>
                <div>
                  <div className="cart-itemTitleRow">
                    <h3 className="cart-itemTitle">{info?.movie_title || 'Movie'}</h3>
                    <span className="chip">Ticket ({group.items.length})</span>
                  </div>
                  <div className="opacity-85">{info?.theater_name} — {info?.screen_name}</div>
                  <div className="mt-6">{timeStr}</div>
                  <div className="mt-10">
                    <div className="opacity-85"><small>Seats: {seatList}</small></div>
                    <div className="cart-itemSeatChips">
                      {group.items.map(it => (
                        <button key={it.id} className="chip" title={`Remove ${it.seat_label}`} onClick={() => removeItem(it.id)}>
                          {it.seat_label} ✕
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="cart-itemPriceValue">${groupTotal.toFixed(2)}</div>
                </div>
              </div>
            )
          })}

          <div className="cart-subtotalRow">
            <div><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</div>
            <button className="btn primary cart-checkoutBtn" onClick={() => navigate('/checkout')}>Checkout</button>
          </div>
        </>
      )}
    </section>
  )
}
