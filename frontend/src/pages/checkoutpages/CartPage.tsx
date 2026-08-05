import { useNavigate, Link } from 'react-router-dom'
import { imageUrl } from '../../api'
import { useCart } from '../../hooks/orders/useCart'
import './CartPage.css'

export default function CartPage() {
  const navigate = useNavigate()
  const { cart, loading, error, removeItem, subtotal, groups } = useCart()

  if (loading) return <section className="container"><div className="card">Loading cart…</div></section>
  if (error) return <section className="container"><div className="card">{error}</div></section>

  const itemCount = cart?.items?.length || 0

  return (
    <section className="container fade-in section-pad">
      <h2 className="mt-0">Shopping Cart</h2>
      {/* Item-count strip -- no button here anymore. There used to be a
          Checkout button both here and on the subtotal row below, which
          was a confusing duplicate CTA; the subtotal row is the only
          Checkout button now, since it's the one paired with the actual
          price the user is agreeing to pay. */}
      <div className="card cart-summaryBar">
        <div className="cart-summaryCount">
          <span className="cart-summaryIcon" aria-hidden>🛒</span>
          {itemCount} Item{itemCount === 1 ? '' : 's'} in Cart
        </div>
      </div>

      {(!cart || cart.items.length === 0) ? (
        <div className="card cart-emptyCard">
          <div className="cart-emptyIcon" aria-hidden>🎬</div>
          <div className="cart-emptyTitle">Your cart is empty</div>
          <div className="opacity-8">Grab some tickets and they'll show up here.</div>
          <Link to="/showtimes"><button className="btn-solid-primary mt-16">Find Showtimes</button></Link>
        </div>
      ) : (
        <>
          <h3 className="cart-sectionHeading">Order Summary</h3>
          {groups.map(([showtimeId, group]) => {
            const info = group.info
            const basePrice = group.items.length
              ? (typeof group.items[0].unit_price === 'number' ? group.items[0].unit_price : parseFloat(String(group.items[0].unit_price)))
              : 0
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
                  <div className="cart-itemMeta">
                    <span className="cart-itemMetaRow"><span className="mi-icon" aria-hidden>📍</span>{info?.theater_name} — {info?.screen_name}</span>
                    <span className="cart-itemMetaRow"><span className="mi-icon" aria-hidden>🕒</span>{timeStr}</span>
                    <span className="cart-itemMetaRow"><span className="mi-icon" aria-hidden>🎟️</span>${basePrice.toFixed(2)} base ticket price</span>
                  </div>
                  <div className="mt-10">
                    <div className="opacity-85"><small>Seats: {seatList}</small></div>
                    <div className="cart-itemSeatChips">
                      {group.items.map(it => (
                        <button key={it.id} className="cart-seatChip" title={`Remove ${it.seat_label}`} onClick={() => removeItem(it.id)}>
                          {it.seat_label} <span aria-hidden>✕</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="cart-itemPriceValue">${groupTotal.toFixed(2)}</div>
                  <div className="cart-itemPriceBreakdown opacity-7">${basePrice.toFixed(2)} × {group.items.length}</div>
                </div>
              </div>
            )
          })}

          <div className="card cart-subtotalRow">
            <div className="cart-subtotalText"><span className="opacity-8">Subtotal</span><strong>${subtotal.toFixed(2)}</strong></div>
            <button className="btn-solid-primary cart-checkoutBtn" onClick={() => navigate('/checkout')}>Checkout</button>
          </div>
        </>
      )}
    </section>
  )
}
