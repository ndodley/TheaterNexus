import { useEffect, useState } from 'react'
import { api, imageUrl } from '../api'
import type { Movie } from '../types'
import { Link } from 'react-router-dom'

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get('/api/movies/')
      .then(res => { if (active) setMovies(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) return <section className="container"><div className="card">Loading movies…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container slide-up" style={{paddingTop: 24, paddingBottom: 24}}>
      <h2 style={{margin:'8px 0 16px', letterSpacing: 0.2}}>Now Showing</h2>
      <div className="grid">
        {movies.map(m => (
          <article key={m.id} className="card" style={{overflow:'hidden', transition: 'transform 180ms ease'}}>
            {m.image && (
              <img src={imageUrl(m.image)} alt={m.title} style={{width:'100%', height:180, objectFit:'cover', borderRadius:12}} />
            )}
            <div style={{paddingTop:12}}>
              <h3 style={{margin:'0 0 6px'}}>{m.title}</h3>
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                {m.genres.map(g => <span className="badge" key={g.id}>{g.name}</span>)}
              </div>
              <div style={{marginTop:10, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                {(() => {
                  const val = typeof m.rating_average === 'number' ? m.rating_average : parseFloat(m.rating_average ?? '0')
                  const text = isNaN(val) ? 'N/A' : val.toFixed(1)
                  return <small style={{opacity:0.8}}>Rating: {text}</small>
                })()}
                <Link to={`/movies/${m.id}`}><button style={{ backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}>Details</button></Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
