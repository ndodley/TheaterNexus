import { api } from './client'

export function getCart() {
  return api.get('/api/orders/cart/')
}

export function addCartItem(showtimeId: number, seatId: number) {
  return api.post('/api/orders/cart/add/', { showtime_id: showtimeId, seat_id: seatId })
}

export function removeCartItem(itemId: number) {
  return api.delete(`/api/orders/cart/remove/${itemId}/`)
}

export function getOrders() {
  return api.get('/api/orders/')
}

export function getOrder(orderId: number | string) {
  return api.get(`/api/orders/${orderId}/`)
}

export function getCheckoutConfig() {
  return api.get('/api/orders/config/')
}

export function createCheckoutIntent() {
  return api.post('/api/orders/checkout/create-intent/')
}

export function finalizeCheckout(orderId: number) {
  return api.post(`/api/orders/checkout/finalize/${orderId}/`)
}
