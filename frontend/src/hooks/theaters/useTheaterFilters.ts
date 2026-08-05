import { useMemo, useState } from 'react'
import type { Theater } from '../../types'
import type { FilterSection } from '../../components/AdvancedSearchPanel'

export type TheaterSortField = 'name' | 'screen_count'
export type TheaterStatus = 'any' | 'active' | 'inactive'
export type TheaterRoomsRange = 'any' | 'lt3' | '3to5' | 'gt5'

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'screen_count', label: 'Rooms' },
]
const ORDER_OPTIONS = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
]
const STATUS_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]
const ROOMS_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: 'lt3', label: 'Less than 3' },
  { value: '3to5', label: '3–5' },
  { value: 'gt5', label: '6+' },
]

/**
 * The "advanced search" filter state for the Theaters list page, plus the
 * client-side filter/sort logic itself. The theaters API has no
 * server-side filter params, so -- following the RetailForge2 pattern
 * (useMyFavoriteFilters takes `products` and returns `visibleProducts`) --
 * this hook takes the already-fetched `theaters` list and returns the
 * final `visibleTheaters`, so TheatersPage doesn't need any filtering
 * logic, or any filter-block JSX, of its own. "Address" is a single-
 * option checkbox section (not a dedicated toggle type -- AdvancedSearch
 * Panel's real, RetailForge2-matching shape has no toggle concept).
 */
export function useTheaterFilters(theaters: Theater[] = []) {
  const [q, setQ] = useState('')
  const [sortField, setSortField] = useState<TheaterSortField>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [status, setStatus] = useState<TheaterStatus>('any')
  const [roomsRange, setRoomsRange] = useState<TheaterRoomsRange>('any')
  const [hasAddress, setHasAddress] = useState<boolean>(false)

  /** Resets every filter (including the search text) back to its default. */
  const resetFilters = () => {
    setQ('')
    setSortField('name')
    setSortOrder('asc')
    setStatus('any')
    setRoomsRange('any')
    setHasAddress(false)
  }

  const visibleTheaters = useMemo(() => {
    const base = theaters.filter(t => {
      if (q && !(`${t.name} ${t.address || ''}`.toLowerCase().includes(q.toLowerCase()))) return false
      if (status === 'active' && !t.is_active) return false
      if (status === 'inactive' && t.is_active) return false
      if (hasAddress && !t.address) return false
      if (roomsRange === 'lt3' && !(t.screen_count < 3)) return false
      if (roomsRange === '3to5' && !(t.screen_count >= 3 && t.screen_count <= 5)) return false
      if (roomsRange === 'gt5' && !(t.screen_count >= 6)) return false
      return true
    })
    base.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      } else {
        cmp = (a.screen_count || 0) - (b.screen_count || 0)
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return base
  }, [theaters, q, status, roomsRange, hasAddress, sortField, sortOrder])

  const filterSections: FilterSection[] = useMemo(() => {
    const sections: FilterSection[] = [
      { key: 'sort', title: 'Sort', type: 'radio', value: sortField, onChange: (v) => setSortField(v as TheaterSortField), options: SORT_OPTIONS },
      { key: 'order', title: 'Order', type: 'radio', value: sortOrder, onChange: (v) => setSortOrder(v as 'asc' | 'desc'), options: ORDER_OPTIONS },
      { key: 'status', title: 'Status', type: 'radio', value: status, onChange: (v) => setStatus(v as TheaterStatus), options: STATUS_OPTIONS },
      { key: 'rooms', title: 'Rooms', type: 'radio', value: roomsRange, onChange: (v) => setRoomsRange(v as TheaterRoomsRange), options: ROOMS_OPTIONS },
      {
        key: 'address', title: 'Address', type: 'checkbox',
        values: hasAddress ? ['true'] : [],
        onChange: (v) => setHasAddress((v as string[]).includes('true')),
        options: [{ value: 'true', label: 'Has address' }],
      },
    ]
    return sections
  }, [sortField, sortOrder, status, roomsRange, hasAddress])

  return { q, setQ, filterSections, visibleTheaters, resetFilters }
}
