import { Link, NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle.tsx'

export default function Navbar() {
  return (
    <nav className="nav" style={{ background: 'var(--nav-bg)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
        <Link to="/" className="logo" style={{ fontWeight: 800, fontSize: 20, color: 'var(--nav-text)' }} aria-label="MP2 Home">MP2 Tickets</Link>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <NavLink to="/" style={({ isActive }) => ({ color: isActive ? 'var(--primary-300)' : 'var(--nav-text)', fontWeight: 600 })} end>Home</NavLink>
          <NavLink to="/movies" style={({ isActive }) => ({ color: isActive ? 'var(--primary-300)' : 'var(--nav-text)', fontWeight: 600 })}>Movies</NavLink>
          <ThemeToggle />
        </nav>
      </div>
    </nav>
  )
}
