import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTheaters } from '../api/theaters'
import { useFetch } from '../hooks/useFetch'
import AdvancedSearchPanel, { AdvancedSearchBlock } from '../components/AdvancedSearchPanel'
import './Theaters.css'

export default function TheatersPage() {
  const navigate = useNavigate()
  // Filters
  const [q, setQ] = useState('')
  const [sortField, setSortField] = useState<'name' | 'screen_count'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [status, setStatus] = useState<'any' | 'active' | 'inactive'>('any')
  const [roomsRange, setRoomsRange] = useState<'any' | 'lt3' | '3to5' | 'gt5'>('any')
  const [hasAddress, setHasAddress] = useState<boolean>(false)

  const { data: items = [], loading, error } = useFetch(
    () => getTheaters().then(res => res.data),
    [],
    { errorFallback: 'Failed to load theaters' },
  )

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
    <section className="container slide-up section-pad">
      <h2 className="adv-page-heading">Theaters</h2>

      {/* Advanced Search panel */}
      <AdvancedSearchPanel
        searchValue={q}
        onSearchChange={setQ}
        onSearch={() => { /* client-side, nothing to fetch */ }}
        placeholder="Search theaters…"
        gapped
      >
        <AdvancedSearchBlock label="Sort">
          <div className="adv-small adv-small--label">Field</div>
          <div className="adv-row">
            <label className="adv-inline">
              <input type="radio" name="sortField" value="name" checked={sortField==='name'} onChange={() => setSortField('name')} />
              <span>Name</span>
            </label>
            <label className="adv-inline">
              <input type="radio" name="sortField" value="screen_count" checked={sortField==='screen_count'} onChange={() => setSortField('screen_count')} />
              <span>Rooms</span>
            </label>
          </div>
        </AdvancedSearchBlock>

        <AdvancedSearchBlock label="Order">
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
        </AdvancedSearchBlock>

        <AdvancedSearchBlock label="Status">
          <div className="adv-row">
            <label className="adv-inline"><input type="radio" name="status" checked={status==='any'} onChange={() => setStatus('any')} /><span>Any</span></label>
            <label className="adv-inline"><input type="radio" name="status" checked={status==='active'} onChange={() => setStatus('active')} /><span>Active</span></label>
            <label className="adv-inline"><input type="radio" name="status" checked={status==='inactive'} onChange={() => setStatus('inactive')} /><span>Inactive</span></label>
          </div>
        </AdvancedSearchBlock>

        <AdvancedSearchBlock label="Rooms">
          <div className="adv-row">
            <label className="adv-inline"><input type="radio" name="rooms" checked={roomsRange==='any'} onChange={() => setRoomsRange('any')} /><span>Any</span></label>
            <label className="adv-inline"><input type="radio" name="rooms" checked={roomsRange==='lt3'} onChange={() => setRoomsRange('lt3')} /><span>Less than 3</span></label>
            <label className="adv-inline"><input type="radio" name="rooms" checked={roomsRange==='3to5'} onChange={() => setRoomsRange('3to5')} /><span>3–5</span></label>
            <label className="adv-inline"><input type="radio" name="rooms" checked={roomsRange==='gt5'} onChange={() => setRoomsRange('gt5')} /><span>6+</span></label>
          </div>
        </AdvancedSearchBlock>

        <AdvancedSearchBlock label="Address">
          <label className="adv-inline">
            <input type="checkbox" checked={hasAddress} onChange={e => setHasAddress(e.target.checked)} />
            <span>Has address</span>
          </label>
        </AdvancedSearchBlock>
      </AdvancedSearchPanel>
      {filtered.length === 0 && <div className="card">No theaters match your filters.</div>}
      <div className="cards-grid">
        {filtered.map(t => (
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
