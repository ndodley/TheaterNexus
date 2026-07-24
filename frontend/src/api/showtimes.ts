import { api } from './client'
import type { ShowTime, Seat } from '../types'

export function getShowtimes(params?: Record<string, string>) {
  return api.get<ShowTime[]>('/api/showtimes/', { params })
}

export interface SeatsResponse {
  showtime: ShowTime
  seats: Seat[]
}

export function getShowtimeSeats(showtimeId: number | string) {
  return api.get<SeatsResponse>(`/api/showtimes/${showtimeId}/seats/`)
}
