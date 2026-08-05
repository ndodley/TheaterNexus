import { useMemo, useState } from 'react'

/**
 * Ported from RetailForge2's hooks/usePagination.ts. Takes any already-
 * filtered/sorted list and a page size, and returns the current page's
 * slice (`pagedItems`) plus everything a page needs to render Prev/Next
 * controls -- `safePage` self-corrects if `page` is ever out of range
 * (e.g. the list shrank after a filter change), so callers don't need to
 * reset `page` themselves.
 */
export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const pagedItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  )

  return { page, setPage, safePage, totalPages, pagedItems }
}
