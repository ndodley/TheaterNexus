import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheaterFilters } from '../../hooks/theaters/useTheaterFilters'
import { useTheaters } from '../../hooks/theaters/useTheaters'
import { usePagination } from '../../hooks/usePagination'
import AdvancedSearchPanel from '../../components/AdvancedSearchPanel'
import '../../styles/pagination.css'
import './TheatersPage.css'

const PAGE_SIZE = 12

export default function TheatersPage() {
  const navigate = useNavigate()
  const { items, loading, error } = useTheaters()

  // Filters -- filter/sort logic lives in useTheaterFilters, which returns
  // the already-filtered `visibleTheaters` directly.
  const { q, setQ, filterSections, visibleTheaters, resetFilters } = useTheaterFilters(items)

  const [filtersOpen, setFiltersOpen] = useState(false)

  const { setPage, safePage, totalPages, pagedItems } = usePagination(visibleTheaters, PAGE_SIZE)

  if (loading) return <section className="container"><div className="card">Loading theaters…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container slide-up section-pad">
      <h2 className="adv-page-heading">Theaters</h2>

      {/* Advanced Search panel -- filter definitions live in useTheaterFilters */}
      <AdvancedSearchPanel
        query={q}
        onQueryChange={setQ}
        isOpen={filtersOpen}
        onToggleOpen={() => setFiltersOpen(o => !o)}
        onSearch={() => setFiltersOpen(false)}
        onReset={resetFilters}
        sections={filterSections}
      />
      {visibleTheaters.length === 0 && <div className="card">No theaters match your filters.</div>}

      {visibleTheaters.length > 0 && (
        <div className="pagination-bar">
          <small className="opacity-7">
            Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, visibleTheaters.length)} of {visibleTheaters.length}
          </small>
          <div className="pagination-controls">
            <button type="button" className="btn btn-ghost" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span className="pagination-pageIndicator">Page {safePage} / {totalPages}</span>
            <button type="button" className="btn btn-ghost" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      <div className="cards-grid">
        {pagedItems.map(t => (
          <article
            key={t.id}
            className="card theaters-cardItem"
            onClick={() => navigate(`/theaters/${t.id}/showtimes`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/theaters/${t.id}/showtimes`) }}
          >
            <div className="theaters-cardBody">
              <h3 className="m-0">{t.name}</h3>
              {t.address && (
                <div className="theaters-cardAddress">
                  <span role="img" aria-label="Location">📍</span>
                  <span>{t.address}</span>
                </div>
              )}
              <div className="flex-between-baseline">
                <small className="chip">{t.is_active ? 'Active' : 'Inactive'}</small>
                <small className="opacity-8">Rooms: {t.screen_count}</small>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
