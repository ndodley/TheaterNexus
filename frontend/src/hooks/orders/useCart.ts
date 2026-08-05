import { useMemo } from 'react'
import { useFetch } from '../useFetch'
import { getCart, removeCartItem } from '../../api/orders'

export interface ShowtimeInfo { movie_title: string; movie_image?: string | null; theater_name: string; screen_name: string; start_time: string }

export interface CartItem {
  id: number
  showtime: number
  seat: number
  seat_label: string
  unit_price: number | string
  hold_expires_at: string
  showtime_info?: ShowtimeInfo | null
}

export interface Cart {
  id: number
  status: string
  expires_at?: string | null
  created_at: string
  items: CartItem[]
}

/**
 * CartPage's cart fetch + remove-item logic. Mirrors the original inline
 * useFetch/useState wiring exactly -- same `[]` deps, same error fallback,
 * same optimistic setCart-from-response on removal.
 */
export function useCart() {
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

  return { cart, loading, error, removeItem, subtotal, groups }
}
