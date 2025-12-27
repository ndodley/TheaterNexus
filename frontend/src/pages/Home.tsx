import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, imageUrl } from '../api'
import type { Movie } from '../types'

export default function HomePage() {
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

  const nowShowing = movies.filter(m => (m.availability_status || '').toLowerCase() === 'now_showing')
  const comingSoon = movies.filter(m => (m.availability_status || '').toLowerCase() === 'coming_soon')

  return (
    <div>
      {/* Hero */}
      <section className="fade-in" style={{ paddingTop: 40, paddingBottom: 40, background: 'linear-gradient(180deg, rgba(124,58,237,0.10), rgba(124,58,237,0.03))' }}>
        <div className="container">
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <h1 style={{ marginTop: 0, marginBottom: 12 }}>
              Welcome to <span className="logo" style={{ color: 'var(--primary)' }}>MP2</span>
            </h1>
            <p style={{ margin: 0, opacity: 0.85 }}>Your modern movie ticketing experience. Browse films, explore details, and book with ease.</p>
            <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link to="/movies"><button style={{ backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}>Browse Movies</button></Link>
              <a href="#now-showing"><button>Now Showing</button></a>
              <a href="#coming-soon"><button>Coming Soon</button></a>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        {loading && (
          <div className="card">Loading featured movies…</div>
        )}
        {error && (
          <div className="card">Error: {error}</div>
        )}

        {!loading && !error && (
          <>
            {nowShowing.length > 0 && (
              <div id="now-showing" style={{ marginBottom: 24 }}>
                <h2 style={{ margin: '8px 0 12px' }}>Now Showing</h2>
                <div className="scroll-row">
                  {nowShowing.slice(0, 10).map(m => (
                    <Link key={m.id} to={`/movies/${m.id}`} className="card" style={{ display: 'block', padding: 0, overflow: 'hidden' }}>
                      {m.image && (
                        <img src={imageUrl(m.image)} alt={m.title} style={{ width: '100%', height: 240, objectFit: 'cover' }} />
                      )}
                      <div style={{ padding: 10 }}>
                        <div style={{ fontWeight: 600 }}>{m.title}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                          {m.genres.slice(0, 2).map(g => <span key={g.id} className="badge">{g.name}</span>)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {comingSoon.length > 0 && (
              <div id="coming-soon" style={{ marginBottom: 24 }}>
                <h2 style={{ margin: '8px 0 12px' }}>Coming Soon</h2>
                <div className="scroll-row">
                  {comingSoon.slice(0, 10).map(m => (
                    <Link key={m.id} to={`/movies/${m.id}`} className="card" style={{ display: 'block', padding: 0, overflow: 'hidden' }}>
                      {m.image && (
                        <img src={imageUrl(m.image)} alt={m.title} style={{ width: '100%', height: 240, objectFit: 'cover' }} />
                      )}
                      <div style={{ padding: 10 }}>
                        <div style={{ fontWeight: 600 }}>{m.title}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                          {m.genres.slice(0, 2).map(g => <span key={g.id} className="badge">{g.name}</span>)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
