import { useEffect, useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { api, imageUrl } from '../api'

// Prefer Vite env var; fall back to backend config
const ENV_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ''

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

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
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
      await api.post(`/api/orders/checkout/finalize/${orderId}/`)
    } catch {}
    setSubmitting(false)
    navigate(`/orders/confirmation?order_id=${orderId}`)
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: 18 }}>
      <PaymentElement />
      {error && (
        <div className="card" style={{ marginTop: 12, background: '#fee' }}>
          {error}
        </div>
      )}
      <button className="btn primary" disabled={!stripe || submitting} style={{ marginTop: 12 }}>
        {submitting ? 'Processing…' : 'Pay'}
      </button>
    </form>
  )
}

export default function CheckoutPage() {
  const [publishableKey, setPublishableKey] = useState<string>(ENV_PUBLISHABLE_KEY)
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey])

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<Array<{
    seat_label: string
    unit_price: number | string
    showtime_info?: {
      movie_title?: string
      movie_image?: string
      theater_name?: string
      screen_name?: string
      start_time?: string
    }
  }>>([])
  const [currency, setCurrency] = useState<string>('')

  // Group cart items by showtime to present a modern summary
  const groups = useMemo(() => {
    const map = new Map<string, typeof cartItems>()
    for (const item of cartItems) {
      const info = item.showtime_info ?? {}
      const key = [info.movie_title, info.start_time, info.screen_name, info.theater_name]
        .map(v => v ?? '')
        .join(' | ')
      const arr = map.get(key) ?? []
      arr.push(item)
      map.set(key, arr)
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }))
  }, [cartItems])

  const summarySubtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + (typeof it.unit_price === 'number' ? it.unit_price : parseFloat(String(it.unit_price))), 0)
  }, [cartItems])

  useEffect(() => {
    let isActive = true

    const fetchConfigAndInit = async () => {
      try {
        // If no env key, fetch from backend
        if (!ENV_PUBLISHABLE_KEY) {
          const { data } = await api.get('/api/orders/config/')
          if (!isActive) return
          const keyVal = typeof data?.publishable_key === 'string' ? data.publishable_key : String(data?.publishable_key ?? '')
          if (keyVal) {
            setPublishableKey(keyVal)
          } else {
            setError('Stripe publishable key not configured.')
            return
          }
          if (typeof data?.currency === 'string') {
            setCurrency(data.currency.toUpperCase())
          }
        }
      } catch (e: any) {
        if (!isActive) return
        setError('Stripe publishable key not configured.')
        return
      }

      // Load cart to show order summary
      try {
        const cartRes = await api.get('/api/orders/cart/')
        if (!isActive) return
        const items = Array.isArray(cartRes?.data?.items)
          ? cartRes.data.items
          : Array.isArray(cartRes?.data)
          ? cartRes.data
          : []
        if (Array.isArray(items)) {
          setCartItems(items)
        }
      } catch {
        // Non-blocking for checkout; summary will be empty
      }

      try {
        const res = await api.post('/api/orders/checkout/create-intent/')
        if (!isActive) return
        if (res?.data?.client_secret && res?.data?.order_id) {
          setClientSecret(res.data.client_secret)
          setOrderId(res.data.order_id)
        } else {
          setError('Failed to initialize checkout.')
        }
      } catch (err: any) {
        if (!isActive) return
        setError(err?.message ?? 'Failed to initialize checkout.')
      }
    }

    fetchConfigAndInit()

    return () => {
      isActive = false
    }
  }, [])

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
    <section className="container fade-in" style={{ paddingTop: 24, paddingBottom: 24 }}>
      <Link to={'/cart'} style={{ display: 'inline-block', marginBottom: 12 }}>
        ← Back to Cart
      </Link>
      <h2 style={{ marginTop: 0 }}>Checkout</h2>
      <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Order Summary</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {currency && <span style={{ opacity: 0.8 }}>Currency: {currency}</span>}
                <strong style={{ fontSize: 16 }}>Total: ${summarySubtotal.toFixed(2)}</strong>
              </div>
            </div>
            {groups.length === 0 ? (
              <div style={{ marginTop: 8, opacity: 0.8 }}>No items found in cart.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                {groups.map(({ key, items }) => {
                  const info = items[0]?.showtime_info ?? {}
                  const start = info.start_time ? new Date(info.start_time) : null
                  const when = start ? `${start.toLocaleDateString()} • ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''
                  const groupTotal = items.reduce((acc, it) => acc + (typeof it.unit_price === 'number' ? it.unit_price : parseFloat(String(it.unit_price))), 0)
                  return (
                    <div key={key} style={{ display: 'flex', gap: 12 }}>
                      {info.movie_image ? (
                        <img
                          src={imageUrl(info.movie_image)}
                          alt={info.movie_title ?? 'Poster'}
                          style={{ width: 84, height: 126, objectFit: 'cover', borderRadius: 8 }}
                        />
                      ) : (
                        <div style={{ width: 84, height: 126, borderRadius: 8, background: '#eee' }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{info.movie_title || 'Movie'}</div>
                        <div style={{ opacity: 0.8, marginTop: 4 }}>
                          {info.theater_name || ''} {info.screen_name ? `• ${info.screen_name}` : ''}
                        </div>
                        {when && <div style={{ opacity: 0.8 }}>{when}</div>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                          {items.map((ci, idx) => (
                            <span key={idx} className="chip" style={{ padding: '6px 10px', borderRadius: 16, background: '#f3f4f6' }}>
                              {ci.seat_label}
                            </span>
                          ))}
                        </div>
                        <div style={{ marginTop: 8, opacity: 0.8 }}>Tickets: {items.length}</div>
                        <div style={{ marginTop: 4, fontWeight: 600 }}>${groupTotal.toFixed(2)}</div>
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
