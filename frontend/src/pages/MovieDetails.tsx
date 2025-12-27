import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, imageUrl } from '../api'
import type { Movie } from '../types'

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    api.get(`/api/movies/${id}/`).then(res => setMovie(res.data)).catch(err => setError(err?.message ?? 'Failed to load'))
  }, [id])

  if (error) return <section className="container"><div className="card">Error: {error}</div></section>
  if (!movie) return <section className="container"><div className="card">Loading…</div></section>

  return (
    <section className="container fade-in" style={{paddingTop: 24, paddingBottom: 24}}>
      <Link to="/movies" style={{display:'inline-block', marginBottom:12}}>← Back to Movies</Link>
      <div className="card" style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:24}}>
        {movie.image && (
          <img src={imageUrl(movie.image)} alt={movie.title} style={{width:'100%', height:360, objectFit:'cover', borderRadius:12}} />
        )}
        <div>
          <h2 style={{marginTop:0}}>{movie.title}</h2>
          <p style={{opacity:0.9}}>{movie.plot_summary || 'No summary available.'}</p>
          <div style={{marginTop:12, display:'flex', gap:8, flexWrap:'wrap'}}>
            {movie.genres.map(g => <span key={g.id} className="badge">{g.name}</span>)}
          </div>
          <div style={{marginTop:16, display:'grid', gridTemplateColumns:'repeat(2, minmax(0,1fr))', gap:12}}>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Duration</small>
              <div>{movie.duration_minutes} min</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Release Date</small>
              <div>{movie.release_date || 'TBA'}</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Availability</small>
              <div>{movie.availability_status.replace('_',' ')}</div>
            </div>
            <div className="card" style={{padding:12}}>
              <small style={{opacity:0.8}}>Rating</small>
              <div>{(() => { const val = typeof movie.rating_average === 'number' ? movie.rating_average : parseFloat(movie.rating_average ?? '0'); return isNaN(val) ? 'N/A' : val.toFixed(1) })()}</div>
            </div>
          </div>
          <div style={{marginTop:16}}>
            <Link to="/movies"><button style={{ backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}>Back to Movies</button></Link>
          </div>
        </div>
      </div>
    </section>
  )
}
