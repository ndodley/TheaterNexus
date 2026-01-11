export interface Genre {
  id: number
  name: string
}

export type Availability = 'COMING_SOON' | 'NOW_SHOWING' | 'ENDED'

export interface Movie {
  id: number
  title: string
  duration_minutes: number
  image?: string | null
  image_url?: string | null
  plot_summary: string
  release_date?: string | null
  rating_average: number | string
  mpa_rating?: string | null
  mpa_rating_label?: string | null
  is_favorite?: boolean
  availability_status: Availability
  genres: Genre[]
}

export type ShowTimeStatus = 'planned' | 'on_sale' | 'canceled' | 'ended'

export interface ShowTime {
  id: number
  movie: number
  movie_title: string
  movie_image?: string | null
  movie_duration_minutes?: number
  movie_rating_average?: number | string
  movie_mpa_rating?: string | null
  movie_mpa_rating_label?: string | null
  screen: number
  screen_name: string
  theater: number
  theater_name: string
  theater_address?: string
  start_time: string
  end_time?: string | null
  base_price: number | string
  status: ShowTimeStatus
  seat_count: number
  available_seat_count?: number
}

export type SeatType = 'STANDARD' | 'PREMIUM' | 'ACCESSIBLE'
export type SeatStatus = 'AVAILABLE' | 'BLOCKED'

export interface Seat {
  id: number
  row: string
  number: number
  seat_type: SeatType
  status: SeatStatus
  is_available: boolean
  is_paid?: boolean
  is_held?: boolean
}

export interface Review {
  id: number
  user: number
  user_name: string
  user_email: string
  movie: number
  movie_title: string
  rating: number
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface ReviewSummary {
  movie_id: number
  average_rating: number
  count: number
}

export interface Theater {
  id: number
  name: string
  address?: string
  is_active: boolean
  screen_count: number
}
