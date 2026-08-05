import { useMemo, useState } from 'react'
import { getShowtimeSeats, type SeatsResponse } from '../../api/showtimes'
import { addCartItem } from '../../api/orders'
import type { Seat } from '../../types'
import { useAuth } from '../../auth/AuthContext'
import { useFetch } from '../useFetch'

/**
 * Fetches the seat map for a showtime, tracks the user's in-progress seat
 * selection, and owns the "add selected seats to cart" submit flow
 * (including the 409-conflict re-fetch/reconcile path). Mirrors the logic
 * that used to live inline in SeatSelectionPage.
 */
export function useSeatSelection(id: string | undefined) {
  const { isAuthenticated } = useAuth()
  const { data, setData, loading, error } = useFetch<SeatsResponse>(
    () => getShowtimeSeats(id as string).then(res => res.data),
    [id],
    { errorFallback: 'Failed to load seats' },
  )
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)

  const rows = useMemo<[string, Seat[]][]>(() => {
    const out = new Map<string, Seat[]>()
    if (!data) return []
    for (const s of data.seats) {
      const arr = out.get(s.row) || []
      arr.push(s)
      out.set(s.row, arr)
    }
    out.forEach((arr) => arr.sort((a, b) => a.number - b.number))
    return Array.from(out.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [data])

  const toggle = (seat: Seat) => {
    if (!seat.is_available) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(seat.id)) next.delete(seat.id)
      else next.add(seat.id)
      return next
    })
  }

  const addSelectedToCart = async () => {
    if (!id) return
    if (!isAuthenticated) { window.location.href = '/login'; return }
    const showtimeId = Number(id)
    try {
      setSubmitting(true)
      setNotice(null)
      const seatIds = Array.from(selected)
      // Add each selected seat to cart; backend will refresh holds if already present
      for (const seatId of seatIds) {
        await addCartItem(showtimeId, seatId)
      }
      // Navigate to cart page
      window.location.href = '/cart'
    } catch (err) {
      const e: any = err as any
      const status = e?.response?.status
      if (status === 409) {
        setNotice('One or more seats were just taken. Please review availability and reselect.')
        try {
          const res = await getShowtimeSeats(id)
          setData(res.data)
          const availableIds = new Set<number>(res.data.seats.filter((s: Seat) => s.is_available && !s.is_paid).map((s: Seat) => s.id))
          setSelected(prev => new Set(Array.from(prev).filter(id => availableIds.has(id))))
        } catch {}
      } else {
        console.error('Failed to add to cart', err)
        setNotice('Failed to add to cart. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return {
    data,
    loading,
    error,
    rows,
    selected,
    toggle,
    notice,
    submitting,
    addSelectedToCart,
  }
}
