import { useMemo, useState } from 'react'
import type { Review } from '../../types'
import type { FilterSection } from '../../components/AdvancedSearchPanel'

export type MyReviewsSortField = 'updated_at' | 'rating'

const SORT_OPTIONS = [
  { value: 'updated_at', label: 'Date' },
  { value: 'rating', label: 'Rating' },
]
const ORDER_OPTIONS = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
]
const RATING_MIN_OPTIONS = [
  { value: '0', label: 'Any' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5' },
]

/**
 * UI-only filter state for the My Reviews page, plus the client-side
 * filter/sort logic itself. Like useTheaterFilters, this hook follows the
 * RetailForge2 pattern -- it takes the already-fetched `reviews` list
 * (from useMyReviews) and returns the final `visibleReviews`, so
 * MyReviewsPage doesn't need any filtering logic, or any filter-block
 * JSX, of its own. Matches movie title, review title, or review content
 * against the free-text search.
 */
export function useMyReviewsFilters(reviews: Review[] = []) {
  const [q, setQ] = useState('')
  const [sortField, setSortField] = useState<MyReviewsSortField>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [ratingMin, setRatingMin] = useState<number>(0)

  /** Resets every filter (including the search text) back to its default. */
  const resetFilters = () => {
    setQ('')
    setSortField('updated_at')
    setSortOrder('asc')
    setRatingMin(0)
  }

  const visibleReviews = useMemo(() => {
    const base = reviews.filter(rv => {
      if (ratingMin && rv.rating < ratingMin) return false
      if (q && !(`${rv.movie_title} ${rv.title} ${rv.content}`.toLowerCase().includes(q.toLowerCase()))) return false
      return true
    })
    base.sort((a, b) => {
      const cmp = sortField === 'rating'
        ? a.rating - b.rating
        : new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return base
  }, [reviews, q, ratingMin, sortField, sortOrder])

  const filterSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [
      { key: 'sort', title: 'Sort', type: 'radio', value: sortField, onChange: (v) => setSortField(v as MyReviewsSortField), options: SORT_OPTIONS },
      { key: 'order', title: 'Order', type: 'radio', value: sortOrder, onChange: (v) => setSortOrder(v as 'asc' | 'desc'), options: ORDER_OPTIONS },
      { key: 'ratingMin', title: 'Rating', type: 'radio', value: String(ratingMin), onChange: (v) => setRatingMin(Number(v)), options: RATING_MIN_OPTIONS },
    ]
    return sections
  }, [sortField, sortOrder, ratingMin])

  return { q, setQ, filterSections, visibleReviews, resetFilters }
}
