import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import type { Theater } from '../types'

export default function TheatersPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Theater[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Filters
  const [q, setQ] = useState('')
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false)
  const [openSort, setOpenSort] = useState<boolean>(false)
  const [openOrder, setOpenOrder] = useState<boolean>(false)
  const [openStatus, setOpenStatus] = useState<boolean>(false)
  const [openRooms, setOpenRooms] = useState<boolean>(false)
  const [openAddress, setOpenAddress] = useState<boolean>(false)
  const [sortField, setSortField] = useState<'name' | 'screen_count'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [status, setStatus] = useState<'any' | 'active' | 'inactive'>('any')
  const [roomsRange, setRoomsRange] = useState<'any' | 'lt3' | '3to5' | 'gt5'>('any')
  const [hasAddress, setHasAddress] = useState<boolean>(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    api.get('/api/theaters/')
      .then(res => { if (active) setItems(res.data) })
      .catch(err => { if (active) setError(err?.message ?? 'Failed to load theaters') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Derived: client-side filtered + sorted theaters
  const filtered = useMemo(() => {
    const base = items.filter(t => {
      if (q && !(`${t.name} ${t.address || ''}`.toLowerCase().includes(q.toLowerCase()))) return false
      if (status === 'active' && !t.is_active) return false
      if (status === 'inactive' && t.is_active) return false
      if (hasAddress && !t.address) return false
      if (roomsRange === 'lt3' && !(t.screen_count < 3)) return false
      if (roomsRange === '3to5' && !(t.screen_count >= 3 && t.screen_count <= 5)) return false
      if (roomsRange === 'gt5' && !(t.screen_count >= 6)) return false
      return true
    })
    base.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {
        cmp = a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      } else {
        cmp = (a.screen_count || 0) - (b.screen_count || 0)
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return base
  }, [items, q, status, roomsRange, hasAddress, sortField, sortOrder])

  if (loading) return <section className="container"><div className="card">Loading theaters…</div></section>
  if (error) return <section className="container"><div className="card">Error: {error}</div></section>

  return (
    <section className="container slide-up" style={{paddingTop:24, paddingBottom:24}}>
      <h2 style={{margin:'8px 0 16px'}}>Theaters</h2>

      {/* Advanced Search panel */}
      <div className="card adv-search-section" style={{marginBottom:12}}>
        <div className="adv-search">
          <div className="adv-toolbar">
            <div className="adv-input">
              <span className="icon">🔎</span>
              <input
                type="text"
                placeholder="Search theaters…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
            <button className="btn btn-ghost" onClick={() => setShowAdvanced(s => !s)}>Filter</button>
            <button className="btn btn-primary" onClick={() => { /* client-side, nothing to fetch */ }}>Search</button>
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
                        <input type="radio" name="sortField" value="name" checked={sortField==='name'} onChange={() => setSortField('name')} />
                        <span>Name</span>
                      </label>
                      <label className="adv-inline">
                        <input type="radio" name="sortField" value="screen_count" checked={sortField==='screen_count'} onChange={() => setSortField('screen_count')} />
                        <span>Rooms</span>
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
                        <input type="radio" name="order" value="asc" checked={sortOrder==='asc'} onChange={() => setSortOrder('asc')} />
                        <span>Ascending</span>
                      </label>
                      <label className="adv-inline">
                        <input type="radio" name="order" value="desc" checked={sortOrder==='desc'} onChange={() => setSortOrder('desc')} />
                        <span>Descending</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="adv-block">
                <div className="adv-block-header" onClick={() => setOpenStatus(o => !o)}>
                  <span>Status</span><span className="caret">▾</span>
                </div>
                {openStatus && (
                  <div className="adv-block-body">
                    <div className="adv-row" style={{gridTemplateColumns:'1fr 1fr'}}>
                      <label className="adv-inline"><input type="radio" name="status" checked={status==='any'} onChange={() => setStatus('any')} /><span>Any</span></label>
                      <label className="adv-inline"><input type="radio" name="status" checked={status==='active'} onChange={() => setStatus('active')} /><span>Active</span></label>
                      <label className="adv-inline"><input type="radio" name="status" checked={status==='inactive'} onChange={() => setStatus('inactive')} /><span>Inactive</span></label>
                    </div>
                  </div>
                )}
              </div>

              <div className="adv-block">
                <div className="adv-block-header" onClick={() => setOpenRooms(o => !o)}>
                  <span>Rooms</span><span className="caret">▾</span>
                </div>
                {openRooms && (
                  <div className="adv-block-body">
                    <div className="adv-row" style={{gridTemplateColumns:'1fr 1fr'}}>
                      <label className="adv-inline"><input type="radio" name="rooms" checked={roomsRange==='any'} onChange={() => setRoomsRange('any')} /><span>Any</span></label>
                      <label className="adv-inline"><input type="radio" name="rooms" checked={roomsRange==='lt3'} onChange={() => setRoomsRange('lt3')} /><span>Less than 3</span></label>
                      <label className="adv-inline"><input type="radio" name="rooms" checked={roomsRange==='3to5'} onChange={() => setRoomsRange('3to5')} /><span>3–5</span></label>
                      <label className="adv-inline"><input type="radio" name="rooms" checked={roomsRange==='gt5'} onChange={() => setRoomsRange('gt5')} /><span>6+</span></label>
                    </div>
                  </div>
                )}
              </div>

              <div className="adv-block">
                <div className="adv-block-header" onClick={() => setOpenAddress(o => !o)}>
                  <span>Address</span><span className="caret">▾</span>
                </div>
                {openAddress && (
                  <div className="adv-block-body">
                    <label className="adv-inline">
                      <input type="checkbox" checked={hasAddress} onChange={e => setHasAddress(e.target.checked)} />
                      <span>Has address</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {filtered.length === 0 && <div className="card">No theaters match your filters.</div>}
      <div className="cards-grid">
        {filtered.map(t => (
          <article
            key={t.id}
            className="card"
            style={{padding:16, cursor:'pointer'}}
            onClick={() => navigate(`/theaters/${t.id}/showtimes`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/theaters/${t.id}/showtimes`) }}
          >
            <div style={{display:'grid', gap:8}}>
              <h3 style={{margin:0}}>{t.name}</h3>
              {t.address && (
                <div style={{opacity:0.8, display:'flex', alignItems:'center', gap:6}}>
                  <span role="img" aria-label="Location">📍</span>
                  <span>{t.address}</span>
                </div>
              )}
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                <small className="chip">{t.is_active ? 'Active' : 'Inactive'}</small>
                <small style={{opacity:0.8}}>Rooms: {t.screen_count}</small>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
