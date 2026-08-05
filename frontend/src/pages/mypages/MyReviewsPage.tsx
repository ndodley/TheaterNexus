import { useState } from 'react'
import { Link } from 'react-router-dom'
import { imageUrl } from '../../api'
import { useMyReviews } from '../../hooks/reviews/useMyReviews'
import { useMyReviewsFilters } from '../../hooks/reviews/useMyReviewsFilters'
import { useAuth } from '../../auth/AuthContext'
import { usePagination } from '../../hooks/usePagination'
import AdvancedSearchPanel from '../../components/AdvancedSearchPanel'
import '../../styles/mediaGrid.css'
import '../../styles/pagination.css'
import './MyReviewsPage.css'

const PAGE_SIZE = 6

export default function MyReviewsPage() {
  const { isAuthenticated } = useAuth()
  const { reviews, loading, error, deleteReview } = useMyReviews(isAuthenticated)

  // Filters -- filter/sort logic lives in useMyReviewsFilters, which
  // returns the already-filtered `visibleReviews` directly.
  const { q, setQ, filterSections, visibleReviews, resetFilters } = useMyReviewsFilters(reviews)

  const [filtersOpen, setFiltersOpen] = useState(false)

  const { setPage, safePage, totalPages, pagedItems } = usePagination(visibleReviews, PAGE_SIZE)

  if (loading) return <section className="container"><div className="card">Loading…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container fade-in section-pad">
      <div className="myReviews-header">
        <h2 className="m-0">My Reviews</h2>
        <Link to="/movies">Browse Movies</Link>
      </div>

      {reviews.length > 0 && (
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

      {reviews.length === 0 && (
        <div className="card myReviews-emptyCard">You haven't posted any reviews yet.</div>
      )}
      {reviews.length > 0 && visibleReviews.length === 0 && (
        <div className="card myReviews-emptyCard">No reviews match your filters.</div>
      )}

      {visibleReviews.length > 0 && (
        <div className="pagination-bar">
          <small className="opacity-7">
            Showing {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, visibleReviews.length)} of {visibleReviews.length}
          </small>
          <div className="pagination-controls">
            <button type="button" className="btn btn-ghost" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span className="pagination-pageIndicator">Page {safePage} / {totalPages}</span>
            <button type="button" className="btn btn-ghost" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {pagedItems.map(rv => (
        <div key={rv.id} className="card myReviews-item media-grid">
          <div>
            {rv.movie_image ? (
              <img src={imageUrl(rv.movie_image)} alt={rv.movie_title} className="myReviews-poster" />
            ) : (
              <div className="card myReviews-posterPlaceholder">No image</div>
            )}
          </div>
          <div>
            <div className="myReviews-itemHeader">
              <div>
                <strong>{rv.movie_title}</strong>
                <div className="opacity-8">{new Date(rv.updated_at).toLocaleString()}</div>
              </div>
              <div>{'⭐'.repeat(Math.max(1, Math.min(5, rv.rating)))}</div>
            </div>
            {rv.title && <div className="myReviews-itemTitle">{rv.title}</div>}
            <p className="mt-8">{rv.content}</p>
            <div className="myReviews-actions">
              <Link to={`/movies/${rv.movie}`}><button className="btn-solid-primary">Edit on Movie</button></Link>
              <button onClick={() => deleteReview(rv.id)} className="btn-solid-muted">Delete</button>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
