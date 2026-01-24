import { useEffect, useMemo, useState } from 'react'
import { api, imageUrl } from '../api'
import type { Movie, Genre, Availability } from '../types'
import { Link, useNavigate } from 'react-router-dom'

export default function MoviesPage() {
  const navigate = useNavigate()
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])

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
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [openStatus, setOpenStatus] = useState<boolean>(false)
  const [openGenres, setOpenGenres] = useState<boolean>(false)
  // Advanced collapsible blocks
  const [openSort, setOpenSort] = useState<boolean>(false)
  const [openOrder, setOpenOrder] = useState<boolean>(false)
  const [openDuration, setOpenDuration] = useState<boolean>(false)
  const [openRating, setOpenRating] = useState<boolean>(false)
  const [openMpa, setOpenMpa] = useState<boolean>(false)
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

  const fetchMovies = () => {
    let active = true
    setLoading(true)
    setError(null)
    api.get('/api/movies/', { params })
      .then(res => { if (active) setMovies(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }

  useEffect(() => {
    // Initial data
    let cancelMovies = fetchMovies()
    let active = true
    api.get('/api/genres/')
      .then(res => { if (active) setGenres(res.data) })
      .catch(() => {})
    return () => { cancelMovies(); active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Genres are selected via checkboxes in the Tags block

  // Derived: movies filtered by MPA (client-side)
  const filteredMovies = useMemo(() => movies.filter(m => !mpa || m.mpa_rating === mpa), [movies, mpa])

  const toggleFavorite = async (movieId: number, isFav?: boolean) => {
    try {
      if (isFav) {
        try {
          await api.delete(`/api/movies/${movieId}/favorite/`)
        } catch (err: any) {
          // Fallback for environments where DELETE is blocked
          await api.post(`/api/movies/${movieId}/unfavorite/`)
        }
      } else {
        await api.post(`/api/movies/${movieId}/favorite/`)
      }
      setMovies(prev => prev.map(m => m.id === movieId ? { ...m, is_favorite: !isFav } : m))
    } catch (err: any) {
      if (err?.response?.status === 401) navigate('/login')
      // else ignore silently
    }
  }

  

  if (loading) return <section className="container"><div className="card">Loading movies…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container slide-up" style={{paddingTop: 24, paddingBottom: 24}}>
      <h2 style={{margin:'8px 0 16px', letterSpacing: 0.2}}>
        <span style={{marginRight:8}}>🔎</span> Movies
      </h2>

      {/* Advanced Search panel */}
      <div className="card adv-search-section">
        <div className="adv-search">
        <div className="adv-toolbar">
          <div className="adv-input">
            <span className="icon">🔎</span>
            <input
              type="text"
              placeholder="Search for movies…"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') fetchMovies() }}
            />
          </div>
          <button className="btn btn-ghost" onClick={() => setShowAdvanced(s => !s)}>Filter</button>
          <button className="btn btn-primary" onClick={() => fetchMovies()}>Search</button>
        </div>

        {showAdvanced && (
          <div className="adv-grid">
            <div className="adv-block">
              <div className="adv-block-header" onClick={() => setOpenSort(o => !o)}>
                <span>Sort</span><span className="caret">▾</span>
              </div>
              {openSort && (
                <div className="adv-block-body">
                  <div className="adv-small" style={{marginBottom:6}}>Field</div>
                  <div className="adv-row" style={{gridTemplateColumns:'1fr 1fr'}}>
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
                </div>
              )}
            </div>

            <div className="adv-block">
              <div className="adv-block-header" onClick={() => setOpenOrder(o => !o)}>
                <span>Order</span><span className="caret">▾</span>
              </div>
              {openOrder && (
                <div className="adv-block-body">
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
                </div>
              )}
            </div>

            <div className="adv-block">
              <div className="adv-block-header" onClick={() => setOpenStatus(o => !o)}>
                <span>Series Status</span><span className="caret">▾</span>
              </div>
              {openStatus && (
                <div className="adv-block-body">
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
                </div>
              )}
            </div>

            

            <div className="adv-block">
              <div className="adv-block-header" onClick={() => setOpenGenres(o => !o)}>
                <span>Tags</span><span className="caret">▾</span>
              </div>
              {openGenres && (
                <div className="adv-block-body">
                  <div className="adv-row" style={{gridTemplateColumns:'1fr'}}>
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
                </div>
              )}
            </div>

            <div className="adv-block">
              <div className="adv-block-header" onClick={() => setOpenDuration(o => !o)}>
                <span>Duration</span><span className="caret">▾</span>
              </div>
              {openDuration && (
                <div className="adv-block-body">
                  <div className="adv-small" style={{marginBottom:6}}>Length</div>
                  <div className="adv-row" style={{gridTemplateColumns:'1fr 1fr'}}>
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
                  <label className="adv-inline" style={{marginTop:8}}>
                    <input type="checkbox" checked={hasPoster} onChange={e => setHasPoster(e.target.checked)} />
                    <span>With poster</span>
                  </label>
                </div>
              )}
            </div>

            <div className="adv-block">
              <div className="adv-block-header" onClick={() => setOpenRating(o => !o)}>
                <span>Rating</span><span className="caret">▾</span>
              </div>
              {openRating && (
                <div className="adv-block-body">
                  <div className="adv-small" style={{marginBottom:6}}>Minimum</div>
                  <div className="adv-row" style={{gridTemplateColumns:'1fr 1fr'}}>
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
                </div>
              )}
            </div>

            <div className="adv-block">
              <div className="adv-block-header" onClick={() => setOpenMpa(o => !o)}>
                <span>MPA Rating</span><span className="caret">▾</span>
              </div>
              {openMpa && (
                <div className="adv-block-body">
                  <div className="adv-row" style={{gridTemplateColumns:'1fr 1fr'}}>
                    <label className="adv-inline"><input type="radio" name="mpa" checked={mpa===''} onChange={() => setMpa('')} /><span>Any</span></label>
                    <label className="adv-inline"><input type="radio" name="mpa" checked={mpa==='G'} onChange={() => setMpa('G')} /><span>G</span></label>
                    <label className="adv-inline"><input type="radio" name="mpa" checked={mpa==='PG'} onChange={() => setMpa('PG')} /><span>PG</span></label>
                    <label className="adv-inline"><input type="radio" name="mpa" checked={mpa==='PG-13'} onChange={() => setMpa('PG-13')} /><span>PG-13</span></label>
                    <label className="adv-inline"><input type="radio" name="mpa" checked={mpa==='R'} onChange={() => setMpa('R')} /><span>R</span></label>
                    <label className="adv-inline"><input type="radio" name="mpa" checked={mpa==='NC-17'} onChange={() => setMpa('NC-17')} /><span>NC-17</span></label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="results-header">
        <h3 style={{margin:0}}>Results</h3>
        <small style={{opacity:0.7}}>Showing {filteredMovies.length} movie(s)</small>
      </div>

      <div className="grid">
        {filteredMovies.map(m => (
          <Link
            key={m.id}
            to={`/movies/${m.id}`}
            className="card"
            style={{ display:'block', overflow:'hidden', transition:'transform 180ms ease', cursor:'pointer', textDecoration:'none' }}
          >
            {(m.image_url || m.image) && (
              <img src={imageUrl(m.image_url || m.image)} alt={m.title} style={{width:'100%', height:180, objectFit:'cover', borderRadius:12}} />
            )}
            <div style={{paddingTop:12}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h3 style={{margin:'0 0 6px'}}>{m.title}</h3>
                <button
                  className="btn btn-ghost"
                  title={m.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(m.id, m.is_favorite) }}
                  aria-label={m.is_favorite ? 'Unfavorite' : 'Favorite'}
                  style={{display:'flex', alignItems:'center', gap:6}}
                >
                  <span role="img" aria-label="favorite">{m.is_favorite ? '❤️' : '🤍'}</span>
                </button>
              </div>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                {m.genres.map(g => <span className="badge" key={g.id}>{g.name}</span>)}
              </div>
              <div style={{marginTop:10, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
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
