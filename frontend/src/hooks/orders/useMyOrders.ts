import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { getOrder, getOrders } from '../../api/orders'
import { useFetch } from '../useFetch'

export interface OrderItem {
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

export interface Order {
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

/**
 * All "my orders" data fetching in one file -- the order-history list
 * (useMyOrders) and a single order's details (useMyOrderDetails), both
 * moved out of their respective pages as-is. Merged together (previously
 * two separate files) since both are small and share one Order/OrderItem
 * shape, backed by the same Django OrderSerializer for both the list
 * endpoint (`/api/orders/`) and the detail endpoint (`/api/orders/:id/`)
 * -- including each item's `showtime_info` (movie title/poster/theater/
 * start time).
 */
export function useMyOrders() {
  return useFetch<Order[]>(
    () => getOrders().then(res => res.data),
    [],
    { errorFallback: 'Failed to load orders' },
  )
}

/**
 * Single-order fetch for the order-details page, moved out of
 * MyOrderDetailsPage as-is. Reads the order id from either the
 * `order_id` query param or the `:id` route param, same as before.
 */
export function useMyOrderDetails() {
  const [params] = useSearchParams()
  const { id: routeId } = useParams()
  const orderId = Number(params.get('order_id') || routeId || 0)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!orderId) return
    getOrder(orderId)
      .then(res => { if (active) setOrder(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load order') })
    return () => { active = false }
  }, [orderId])

  return { orderId, order, error }
}
