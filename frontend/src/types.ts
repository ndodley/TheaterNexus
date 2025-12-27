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
