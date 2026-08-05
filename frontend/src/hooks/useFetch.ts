import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'

export interface UseFetchResult<T> {
  data: T | undefined
  setData: React.Dispatch<React.SetStateAction<T | undefined>>
  loading: boolean
  /**
   * True only until the FIRST load (success or failure) resolves, then
   * false forever after -- even while `loading` flips true again on
   * later refetches. Use this (not `loading`) to decide whether to swap
   * the whole page for a full-page loading state: gating on `loading`
   * instead means every refetch (e.g. an auto-refetch triggered by
   * toggling a filter) unmounts the page and any open UI (like an
   * expanded filter panel) along with it.
   */
  initialLoading: boolean
  error: string | null
  setError: React.Dispatch<React.SetStateAction<string | null>>
  /** Re-runs the fetcher on demand (e.g. after a mutation). */
  refetch: () => void
}

/**
 * Generic data-fetching hook.
 *
 * This replaces the `useState(data) + useState(loading) + useState(error) +
 * useEffect` boilerplate that used to be copy-pasted at the top of nearly
 * every page. Pass a `fetcher` that resolves to the value you want in
 * `data` (usually `() => someApiCall(...).then(res => res.data)`), and the
 * same dependency array you'd give `useEffect`.
 *
 * Stale responses are ignored the same way the original hand-rolled
 * `let active = true ... return () => { active = false }` pattern did, so
 * behavior is unchanged if a component unmounts or deps change mid-request.
 */
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList,
  options?: { errorFallback?: string },
): UseFetchResult<T> {
  const [data, setData] = useState<T | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const activeRef = useRef(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const errorFallback = options?.errorFallback ?? 'Failed to load'

  const load = useCallback(() => {
    activeRef.current = true
    setLoading(true)
    setError(null)
    fetcherRef.current()
      .then((res) => { if (activeRef.current) setData(res) })
      .catch((err: any) => { if (activeRef.current) setError(err?.message ?? errorFallback) })
      .finally(() => { if (activeRef.current) { setLoading(false); setInitialLoading(false) } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    return () => { activeRef.current = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, setData, loading, initialLoading, error, setError, refetch: load }
}
