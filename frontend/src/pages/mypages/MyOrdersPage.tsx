import { useState } from 'react'
import { Link } from 'react-router-dom'
import { imageUrl } from '../../api'
import { useMyOrders } from '../../hooks/orders/useMyOrders'
import { useMyOrdersFilters } from '../../hooks/orders/useMyOrdersFilters'
import { usePagination } from '../../hooks/usePagination'
import AdvancedSearchPanel from '../../components/AdvancedSearchPanel'
import '../../styles/orderItem.css'
import '../../styles/pagination.css'
import './MyOrdersPage.css'

const PAGE_SIZE = 6

function toNumber(v: number | string) {
  return typeof v === 'number' ? v : parseFloat(String(v))
}

export default function MyOrdersPage() {
  const { data: orders = [], loading, error } = useMyOrders()

  // Filters -- filter/sort logic lives in useMyOrdersFilters, which
  // returns the already-filtered `visibleOrders` directly.
  const { q, setQ, filterSections, visibleOrders, resetFilters } = useMyOrdersFilters(orders)

  const [filtersOpen, setFiltersOpen] = useState(false)

  const { setPage, safePage, totalPages, pagedItems } = usePagination(visibleOrders, PAGE_SIZE)

  if (loading) return <section className="container"><div className="card">Loading orders…</div></section>
  if (error) return <section className="container"><div className="card">{error}</div></section>

  return (
    <section className="container fade-in section-pad">
      <h2 className="mt-0">My Orders</h2>

      {orders.length > 0 && (
        <AdvancedSearchPanel
          query={q}
          onQueryChange={setQ}
          isOpen={filtersOpen}
          onToggleOpen={() => setFiltersOpen(o => !o)}
          onSearch={() => setFiltersOpen(false)}
          onReset={resetFilters}
          sections={filterSections}
        />
      )}

      {orders.length === 0 && (
        <div className="card">No orders yet. <Link to={'/showtimes'}>Find showtimes</Link></div>
      )}
      {orders.length > 0 && visibleOrders.length === 0 && (
        <div className="card">No orders match your filters.</div>
      )}

      {visibleOrders.length > 0 && (
        <div className="pagination-bar">
          <small className="opacity-7">
            Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, visibleOrders.length)} of {visibleOrders.length}
          </small>
          <div className="pagination-controls">
            <button type="button" className="btn btn-ghost" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span className="pagination-pageIndicator">Page {safePage} / {totalPages}</span>
            <button type="button" className="btn btn-ghost" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {visibleOrders.length > 0 && (
        <div className="ordersHistory-list">
          {pagedItems.map(o => {
            const primaryInfo = o.items[0]?.showtime_info || {}
            const movieIds = new Set(o.items.map(it => it.showtime_info?.movie_id).filter(Boolean))
            const extraMovies = movieIds.size > 1 ? movieIds.size - 1 : 0

            return (
              <div key={o.id} className="card order-itemRow ordersHistory-row">
                <div>
                  {primaryInfo.movie_image ? (
                    <img src={imageUrl(primaryInfo.movie_image)} alt={primaryInfo.movie_title || 'Poster'} className="order-itemPoster" />
                  ) : (
                    <div className="card order-itemPosterPlaceholder">No image</div>
                  )}
                </div>
                <div>
                  <div className="order-itemTitleRow">
                    <h3 className="order-itemTitle">{primaryInfo.movie_title || 'Order'}</h3>
                    {extraMovies > 0 && <span className="chip">+{extraMovies} more</span>}
                  </div>
                  <div className="opacity-85">Order #{o.id} — {new Date(o.created_at).toLocaleString()}</div>
                  <div className="order-itemChips">
                    <span className="chip">{o.status.toUpperCase()}</span>
                    <span className="chip">{o.items.length} ticket{o.items.length === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <div className="order-itemPrice">
                  <div className="order-itemPriceValue">${toNumber(o.total).toFixed(2)} {o.currency.toUpperCase()}</div>
                  <Link to={`/orders/orderdetails?order_id=${o.id}`} className="btn btn-secondary mt-8">Details</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
