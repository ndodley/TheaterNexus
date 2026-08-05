import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { imageUrl } from '../../api'
import { finalizeCheckout } from '../../api/orders'
import { useCheckout } from '../../hooks/orders/useCheckout'
import '../../styles/ticketChip.css'
import './CheckoutPage.css'

function CheckoutForm({ orderId }: { orderId: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/confirmation`,
      },
      redirect: 'if_required',
    })

    if (stripeError) {
      setSubmitting(false)
      setError(stripeError.message ?? 'Payment failed')
      return
    }

    // Navigate to confirmation whether Stripe redirects or not
    try {
      // Finalize order on the backend (fallback when webhooks are not active)
      await finalizeCheckout(orderId)
    } catch {}
    setSubmitting(false)
    navigate(`/orders/confirmation?order_id=${orderId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="card checkout-form">
      <PaymentElement />
      {error && (
        <div className="card checkout-formError">
          {error}
        </div>
      )}
      <button className="btn primary mt-12" disabled={!stripe || submitting}>
        {submitting ? 'Processing…' : 'Pay'}
      </button>
    </form>
  )
}

export default function CheckoutPage() {
  const { publishableKey, stripePromise, clientSecret, orderId, error, currency, groups, summarySubtotal } = useCheckout()

  if (!publishableKey) {
    return (
      <section className="container">
        <div className="card">Stripe publishable key not configured.</div>
      </section>
    )
  }
  if (error) {
    return (
      <section className="container">
        <div className="card">{error}</div>
      </section>
    )
  }
  if (!clientSecret || !orderId || !stripePromise) {
    return (
      <section className="container">
        <div className="card">Preparing checkout…</div>
      </section>
    )
  }


  return (
    <section className="container fade-in section-pad">
      <Link to={'/cart'} className="back-link">
        ← Back to Cart
      </Link>
      <h2 className="mt-0">Checkout</h2>
      <div className="checkout-grid">
        <div>
          <div className="card checkout-summaryCard">
            <div className="checkout-summaryHeader">
              <h3 className="m-0">Order Summary</h3>
              <div className="checkout-summaryTotals">
                {currency && <span className="opacity-8">Currency: {currency}</span>}
                <strong className="checkout-totalValue">Total: ${summarySubtotal.toFixed(2)}</strong>
              </div>
            </div>
            {groups.length === 0 ? (
              <div className="checkout-emptyNote">No items found in cart.</div>
            ) : (
              <div className="checkout-itemsList">
                {groups.map(({ key, items }) => {
                  const info = items[0]?.showtime_info ?? {}
                  const start = info.start_time ? new Date(info.start_time) : null
                  const when = start ? `${start.toLocaleDateString()} • ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
                  const groupTotal = items.reduce((acc, it) => acc + (typeof it.unit_price === 'number' ? it.unit_price : parseFloat(String(it.unit_price))), 0)
                  return (
                    <div key={key} className="checkout-itemRow">
                      {info.movie_image ? (
                        <img
                          src={imageUrl(info.movie_image)}
                          alt={info.movie_title ?? 'Poster'}
                          className="checkout-itemPoster"
                        />
                      ) : (
                        <div className="checkout-itemPosterPlaceholder" />
                      )}
                      <div className="flex-1">
                        <div className="checkout-itemTitle">{info.movie_title || 'Movie'}</div>
                        <div className="checkout-itemMeta">
                          {info.theater_name || ''} {info.screen_name ? `• ${info.screen_name}` : ''}
                        </div>
                        {when && <div className="opacity-8">{when}</div>}
                        <div className="checkout-itemChips">
                          {items.map((ci, idx) => (
                            <span key={idx} className="chip ticket-chip">
                              {ci.seat_label}
                            </span>
                          ))}
                        </div>
                        <div className="checkout-itemTicketCount">Tickets: {items.length}</div>
                        <div className="checkout-itemTotal">${groupTotal.toFixed(2)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
        <div>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm orderId={orderId} />
          </Elements>
        </div>
      </div>
    </section>
  )
}
