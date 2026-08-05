import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getOrder } from '../../api/orders'

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
}

/**
 * ConfirmationPage's single order-by-id fetch, keyed off the `order_id`
 * search param. Mirrors the original inline useEffect/useState exactly,
 * including the `active` guard against setting state after unmount.
 */
export function useOrderConfirmation() {
  const [params] = useSearchParams()
  const orderId = Number(params.get('order_id') || 0)
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

  return { order, error }
}
