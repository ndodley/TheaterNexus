import { useEffect, useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { getCart, getCheckoutConfig, createCheckoutIntent } from '../../api/orders'

// Prefer Vite env var; fall back to backend config
const ENV_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? ''

export interface CheckoutCartItem {
  seat_label: string
  unit_price: number | string
  showtime_info?: {
    movie_title?: string
    movie_image?: string
    theater_name?: string
    screen_name?: string
    start_time?: string
  }
}

/**
 * CheckoutPage's data-fetching/state logic: resolving the Stripe publishable
 * key (env var first, backend config fallback), loading the cart summary,
 * and creating the payment intent. `loadStripe(...)` itself is just the
 * Stripe SDK's plain JS loader (not a React context hook), so it's safe to
 * keep here -- only `useStripe`/`useElements`/`PaymentElement` and the
 * `<Elements>` provider stay in the page, since those are tied to the
 * Elements React tree.
 *
 * The effect's control flow (config -> cart -> create-intent, in that exact
 * order, gated by the same `isActive` guard) is preserved byte-for-byte so
 * the payment flow's timing doesn't change.
 */
export function useCheckout() {
  const [publishableKey, setPublishableKey] = useState<string>(ENV_PUBLISHABLE_KEY)
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey])

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<CheckoutCartItem[]>([])
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
          const { data } = await getCheckoutConfig()
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
        const cartRes = await getCart()
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
        const res = await createCheckoutIntent()
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

  return { publishableKey, stripePromise, clientSecret, orderId, error, currency, groups, summarySubtotal }
}
