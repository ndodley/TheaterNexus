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
  plot_summary: string
  release_date?: string | null
  rating_average: number | string
  availability_status: Availability
  genres: Genre[]
}

export type ShowTimeStatus = 'planned' | 'on_sale' | 'canceled' | 'ended'

export interface ShowTime {
  id: number
  movie: number
  movie_title: string
  movie_image?: string | null
  screen: number
  screen_name: string
  theater: number
  theater_name: string
  start_time: string
  end_time?: string | null
  base_price: number | string
  status: ShowTimeStatus
  seat_count: number
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
}
