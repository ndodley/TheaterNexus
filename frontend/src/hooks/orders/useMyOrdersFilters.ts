import { useMemo, useState } from 'react'
import type { Order } from './useMyOrders'
import type { FilterSection } from '../../components/AdvancedSearchPanel'

export type MyOrdersSortField = 'created_at' | 'total'

const SORT_OPTIONS = [
  { value: 'created_at', label: 'Date' },
  { value: 'total', label: 'Total' },
]
const ORDER_OPTIONS = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
]

function toNumber(v: number | string) {
  return typeof v === 'number' ? v : parseFloat(String(v))
}

/**
 * UI-only filter state for the My Orders page, plus the client-side
 * filter/sort logic itself. Like useTheaterFilters/useMyReviewsFilters,
 * this hook follows the RetailForge2 pattern -- it takes the already-
 * fetched `orders` list (from useMyOrders) and returns the final
 * `visibleOrders`, so MyOrdersPage doesn't need any filtering logic, or
 * any filter-block JSX, of its own. Matches any item's movie title or
 * theater name against the free-text search.
 */
export function useMyOrdersFilters(orders: Order[] = []) {
  const [q, setQ] = useState('')
  const [sortField, setSortField] = useState<MyOrdersSortField>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  /** Resets every filter (including the search text) back to its default. */
  const resetFilters = () => {
    setQ('')
    setSortField('created_at')
    setSortOrder('desc')
  }

  const visibleOrders = useMemo(() => {
    const base = orders.filter(o => {
      if (!q) return true
      const needle = q.toLowerCase()
      return o.items.some(it => {
        const info = it.showtime_info || {}
        return `${info.movie_title ?? ''} ${info.theater_name ?? ''}`.toLowerCase().includes(needle)
      })
    })
    base.sort((a, b) => {
      const cmp = sortField === 'total'
        ? toNumber(a.total) - toNumber(b.total)
        : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return base
  }, [orders, q, sortField, sortOrder])

  const filterSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [
      { key: 'sort', title: 'Sort', type: 'radio', value: sortField, onChange: (v) => setSortField(v as MyOrdersSortField), options: SORT_OPTIONS },
      { key: 'order', title: 'Order', type: 'radio', value: sortOrder, onChange: (v) => setSortOrder(v as 'asc' | 'desc'), options: ORDER_OPTIONS },
    ]
    return sections
  }, [sortField, sortOrder])

  return { q, setQ, filterSections, visibleOrders, resetFilters }
}
