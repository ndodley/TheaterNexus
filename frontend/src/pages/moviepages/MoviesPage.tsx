import { useMemo, useState } from 'react'
import { imageUrl } from '../../api'
import { Link } from 'react-router-dom'
import { useFavoriteToggle } from '../../hooks/useFavoriteToggle'
import { useGenres, useMovies } from '../../hooks/movies/useMovies'
import { useMovieFilters } from '../../hooks/movies/useMovieFilters'
import { usePagination } from '../../hooks/usePagination'
import AdvancedSearchPanel from '../../components/AdvancedSearchPanel'
import '../../styles/movieGrid.css'
import '../../styles/pagination.css'
import './MoviesPage.css'

const PAGE_SIZE = 12

export default function MoviesPage() {
  const { toggleFavorite: toggleFavoriteBase } = useFavoriteToggle()
  const { genres } = useGenres()

  const { q, setQ, mpa, params, liveParamsKey, filterSections, resetFilters } = useMovieFilters(genres)

  const { movies, setMovies, loading, initialLoading, error, refetch: fetchMovies } = useMovies(params, liveParamsKey)

  const [filtersOpen, setFiltersOpen] = useState(false)

  // Derived: movies filtered by MPA (client-side -- the backend has no
  // mpa_rating filter param, see useMovieFilters).
  const filteredMovies = useMemo(() => movies.filter(m => !mpa || m.mpa_rating === mpa), [movies, mpa])

  const { setPage, safePage, totalPages, pagedItems } = usePagination(filteredMovies, PAGE_SIZE)

  const toggleFavorite = (movieId: number, isFav?: boolean) =>
    toggleFavoriteBase(movieId, isFav, (next) => {
      setMovies(prev => (prev ?? []).map(m => m.id === movieId ? { ...m, is_favorite: next } : m))
    })

  if (initialLoading) return <section className="container"><div className="card">Loading movies…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container slide-up section-pad">
      <h2 className="adv-page-heading adv-page-heading--tight">
        <span className="movies-headingIcon">🔎</span> Movies
      </h2>

      {/* Advanced Search panel -- filter definitions live in useMovieFilters */}
      <AdvancedSearchPanel
        query={q}
        onQueryChange={setQ}
        isOpen={filtersOpen}
        onToggleOpen={() => setFiltersOpen(o => !o)}
        onSearch={() => { fetchMovies(); setFiltersOpen(false) }}
        onReset={resetFilters}
        sections={filterSections}
      />

      <div className="results-header">
        <h3 className="m-0">Results</h3>
        <small className="opacity-7">{loading ? 'Updating…' : `Showing ${filteredMovies.length} movie(s)`}</small>
      </div>

      {filteredMovies.length > 0 && (
        <div className="pagination-bar">
          <small className="opacity-7">
            {(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, filteredMovies.length)} of {filteredMovies.length}
          </small>
          <div className="pagination-controls">
            <button type="button" className="btn btn-ghost" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span className="pagination-pageIndicator">Page {safePage} / {totalPages}</span>
            <button type="button" className="btn btn-ghost" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      <div className="grid">
        {pagedItems.map(m => (
          <Link
            key={m.id}
            to={`/movies/${m.id}`}
            className="card movieGrid-card"
          >
            {(m.image_url || m.image) && (
              <img src={imageUrl(m.image_url || m.image)} alt={m.title} className="movieGrid-poster" />
            )}
            <div className="movieGrid-body">
              <div className="movieGrid-titleRow">
                <h3 className="movieGrid-title">{m.title}</h3>
                <button
                  className="btn btn-ghost movieGrid-favBtn"
                  title={m.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(m.id, m.is_favorite) }}
                  aria-label={m.is_favorite ? 'Unfavorite' : 'Favorite'}
                >
                  <span role="img" aria-label="favorite">{m.is_favorite ? '❤️' : '🤍'}</span>
                </button>
              </div>
              <div className="movieGrid-badges">
                {m.genres.map(g => <span className="badge" key={g.id}>{g.name}</span>)}
              </div>
              <div className="movieGrid-chips">
                {(() => {
                  const chips: React.ReactNode[] = []
                  const mpaCode = m.mpa_rating
                  if (mpaCode) chips.push(<span key="mpa" className="chip">{mpaCode}</span>)
                  const val = typeof m.rating_average === 'number' ? m.rating_average : parseFloat((m.rating_average as any) ?? '0')
                  if (!isNaN(val)) chips.push(<span key="rating" className="chip">Rating: {(val as number).toFixed(1)}</span>)
                  if (typeof m.duration_minutes === 'number' && m.duration_minutes > 0) chips.push(<span key="duration" className="chip">Duration: {m.duration_minutes} min</span>)
                  return chips
                })()}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
