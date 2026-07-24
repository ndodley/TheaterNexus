import { useMemo, useState } from 'react'
import { imageUrl } from '../api'
import { getMovies, getGenres } from '../api/movies'
import type { Availability } from '../types'
import { Link } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import { useFavoriteToggle } from '../hooks/useFavoriteToggle'
import AdvancedSearchPanel, { AdvancedSearchBlock } from '../components/AdvancedSearchPanel'
import '../styles/movieGrid.css'
import './Movies.css'

export default function MoviesPage() {
  const { toggleFavorite: toggleFavoriteBase } = useFavoriteToggle()

  // Filters
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'' | Availability>('')
  const [genreIds, setGenreIds] = useState<number[]>([])
  const [durationMin, setDurationMin] = useState<string>('')
  const [durationMax, setDurationMax] = useState<string>('')
  const [ratingMin, setRatingMin] = useState<string>('')
  const [ratingMax, setRatingMax] = useState<string>('')
  const [hasPoster, setHasPoster] = useState<boolean>(false)
  const [sortField, setSortField] = useState<string>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [mpa, setMpa] = useState<''|'G'|'PG'|'PG-13'|'R'|'NC-17'>('')


  const params = useMemo(() => {
    const p: Record<string, string> = {}
    if (q.trim()) p.search = q.trim() // DRF SearchFilter uses ?search=
    if (status) p.status = status
    if (genreIds.length) p.genre_ids = genreIds.join(',')
    if (durationMin) p.duration_min = durationMin
    if (durationMax) p.duration_max = durationMax
    if (ratingMin) p.rating_min = ratingMin
    if (ratingMax) p.rating_max = ratingMax
    if (hasPoster) p.has_poster = 'true'
    const ordering = (sortOrder === 'desc' ? '-' : '') + (sortField || 'release_date')
    p.ordering = ordering
    return p
  }, [q, status, genreIds, durationMin, durationMax, ratingMin, ratingMax, hasPoster, sortField, sortOrder])

  const { data: movies = [], setData: setMovies, loading, error, refetch: fetchMovies } = useFetch(
    () => getMovies(params).then(res => res.data),
    [],
  )
  const { data: genres = [] } = useFetch(() => getGenres().then(res => res.data), [])

  // Genres are selected via checkboxes in the Tags block

  // Derived: movies filtered by MPA (client-side)
  const filteredMovies = useMemo(() => movies.filter(m => !mpa || m.mpa_rating === mpa), [movies, mpa])

  const toggleFavorite = (movieId: number, isFav?: boolean) =>
    toggleFavoriteBase(movieId, isFav, (next) => {
      setMovies(prev => (prev ?? []).map(m => m.id === movieId ? { ...m, is_favorite: next } : m))
    })

  if (loading) return <section className="container"><div className="card">Loading movies…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container slide-up section-pad">
      <h2 className="adv-page-heading adv-page-heading--tight">
        <span className="movies-headingIcon">🔎</span> Movies
      </h2>

      {/* Advanced Search panel */}
      <AdvancedSearchPanel
        searchValue={q}
        onSearchChange={setQ}
        onEnter={fetchMovies}
        onSearch={fetchMovies}
        placeholder="Search for movies…"
      >
        <AdvancedSearchBlock label="Sort">
          <div className="adv-small adv-small--label">Field</div>
          <div className="adv-row">
            <label className="adv-inline">
              <input type="radio" name="sortField" value="release_date" checked={sortField==='release_date'} onChange={() => setSortField('release_date')} />
              <span>Release Date</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="sortField" value="rating_average" checked={sortField==='rating_average'} onChange={() => setSortField('rating_average')} />
              <span>Rating</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="sortField" value="title" checked={sortField==='title'} onChange={() => setSortField('title')} />
              <span>Title</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="sortField" value="duration_minutes" checked={sortField==='duration_minutes'} onChange={() => setSortField('duration_minutes')} />
              <span>Duration</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="sortField" value="created_at" checked={sortField==='created_at'} onChange={() => setSortField('created_at')} />
              <span>Added</span>
            </label>
          </div>
        </AdvancedSearchBlock>

        <AdvancedSearchBlock label="Order">
          <div className="adv-row">
            <label className="adv-inline">
              <input type="radio" name="order" value="desc" checked={sortOrder==='desc'} onChange={() => setSortOrder('desc')} />
              <span>Descending</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="order" value="asc" checked={sortOrder==='asc'} onChange={() => setSortOrder('asc')} />
              <span>Ascending</span>
            </label>
          </div>
        </AdvancedSearchBlock>

        <AdvancedSearchBlock label="Series Status">
          <div className="adv-row">
            <label className="adv-inline">
              <input type="radio" name="status" value="" checked={status===''} onChange={() => setStatus('' as any)} />
              <span>Any</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="status" value="NOW_SHOWING" checked={status==='NOW_SHOWING'} onChange={() => setStatus('NOW_SHOWING')} />
              <span>Now Showing</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="status" value="COMING_SOON" checked={status==='COMING_SOON'} onChange={() => setStatus('COMING_SOON')} />
              <span>Coming Soon</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="status" value="ENDED" checked={status==='ENDED'} onChange={() => setStatus('ENDED')} />
              <span>Ended</span>
            </label>
          </div>
        </AdvancedSearchBlock>

        <AdvancedSearchBlock label="Tags">
          <div className="adv-row adv-row--single">
            {genres.map(g => (
              <label key={g.id} className="adv-inline">
                <input
                  type="checkbox"
                  checked={genreIds.includes(g.id)}
                  onChange={(e) => {
                    setGenreIds(prev => e.target.checked ? [...prev, g.id] : prev.filter(id => id !== g.id))
                  }}
                />
                <span>{g.name}</span>
              </label>
            ))}
          </div>
        </AdvancedSearchBlock>

        <AdvancedSearchBlock label="Duration">
          <div className="adv-small adv-small--label">Length</div>
          <div className="adv-row">
            <label className="adv-inline">
              <input type="radio" name="duration" checked={!durationMin && !durationMax} onChange={() => { setDurationMin(''); setDurationMax(''); }} />
              <span>Any</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="duration" checked={durationMax==='90'} onChange={() => { setDurationMin(''); setDurationMax('90'); }} />
              <span>≤ 90 min</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="duration" checked={durationMin==='91' && durationMax==='120'} onChange={() => { setDurationMin('91'); setDurationMax('120'); }} />
              <span>91–120 min</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="duration" checked={durationMin==='121' && durationMax==='150'} onChange={() => { setDurationMin('121'); setDurationMax('150'); }} />
              <span>121–150 min</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="duration" checked={durationMin==='151' && !durationMax} onChange={() => { setDurationMin('151'); setDurationMax(''); }} />
              <span>≥ 151 min</span>
            </label>
          </div>
          <label className="adv-inline adv-inline--spaced">
            <input type="checkbox" checked={hasPoster} onChange={e => setHasPoster(e.target.checked)} />
            <span>With poster</span>
          </label>
        </AdvancedSearchBlock>

        <AdvancedSearchBlock label="Rating">
          <div className="adv-small adv-small--label">Minimum</div>
          <div className="adv-row">
            <label className="adv-inline">
              <input type="radio" name="rating" checked={!ratingMin} onChange={() => { setRatingMin(''); setRatingMax(''); }} />
              <span>Any</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="rating" checked={ratingMin==='5'} onChange={() => { setRatingMin('5'); setRatingMax(''); }} />
              <span>5+</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="rating" checked={ratingMin==='6'} onChange={() => { setRatingMin('6'); setRatingMax(''); }} />
              <span>6+</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="rating" checked={ratingMin==='7'} onChange={() => { setRatingMin('7'); setRatingMax(''); }} />
              <span>7+</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="rating" checked={ratingMin==='8'} onChange={() => { setRatingMin('8'); setRatingMax(''); }} />
              <span>8+</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="rating" checked={ratingMin==='9'} onChange={() => { setRatingMin('9'); setRatingMax(''); }} />
              <span>9+</span>
            </label>
          </div>
        </AdvancedSearchBlock>

        <AdvancedSearchBlock label="MPA Rating">
          <div className="adv-row">
            <label className="adv-inline"><input type="radio" name="mpa" checked={mpa===''} onChange={() => setMpa('')} /><span>Any</span></label>
            <label className="adv-inline"><input type="radio" name="mpa" checked={mpa==='G'} onChange={() => setMpa('G')} /><span>G</span></label>
            <label className="adv-inline"><input type="radio" name="mpa" checked={mpa==='PG'} onChange={() => setMpa('PG')} /><span>PG</span></label>
            <label className="adv-inline"><input type="radio" name="mpa" checked={mpa==='PG-13'} onChange={() => setMpa('PG-13')} /><span>PG-13</span></label>
            <label className="adv-inline"><input type="radio" name="mpa" checked={mpa==='R'} onChange={() => setMpa('R')} /><span>R</span></label>
            <label className="adv-inline"><input type="radio" name="mpa" checked={mpa==='NC-17'} onChange={() => setMpa('NC-17')} /><span>NC-17</span></label>
          </div>
        </AdvancedSearchBlock>
      </AdvancedSearchPanel>

      <div className="results-header">
        <h3 className="m-0">Results</h3>
        <small className="opacity-7">Showing {filteredMovies.length} movie(s)</small>
      </div>

      <div className="grid">
        {filteredMovies.map(m => (
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
