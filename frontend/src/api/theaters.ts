import { api } from './client'
import type { Theater } from '../types'

export function getTheaters() {
  return api.get<Theater[]>('/api/theaters/')
}

export function getTheater(id: number | string) {
  return api.get<Theater>(`/api/theaters/${id}/`)
}
