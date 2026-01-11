import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle.tsx'
import { useAuth, adminUrl } from '../auth/AuthContext.tsx'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="nav" style={{ background: 'var(--nav-bg)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" className="logo" style={{ fontWeight: 800, fontSize: 20, color: 'var(--nav-text)' }} aria-label="MP2 Home">MP2 Tickets</Link>
          <NavLink to="/movies" style={({ isActive }) => ({ color: isActive ? 'var(--primary-300)' : 'var(--nav-text)', fontWeight: 600 })}>Movies</NavLink>
          <NavLink to="/showtimes" style={({ isActive }) => ({ color: isActive ? 'var(--primary-300)' : 'var(--nav-text)', fontWeight: 600 })}>Showtimes</NavLink>
          <NavLink to="/theaters" style={({ isActive }) => ({ color: isActive ? 'var(--primary-300)' : 'var(--nav-text)', fontWeight: 600 })}>Theaters</NavLink>
          <NavLink to="/orders" style={({ isActive }) => ({ color: isActive ? 'var(--primary-300)' : 'var(--nav-text)', fontWeight: 600 })}>My Orders</NavLink>
          <NavLink to="/my-reviews" style={({ isActive }) => ({ color: isActive ? 'var(--primary-300)' : 'var(--nav-text)', fontWeight: 600 })}>My Reviews</NavLink>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user?.role === 'admin' && (
            <a href={adminUrl()} target="_blank" rel="noreferrer" style={{ color: 'var(--nav-text)', fontWeight: 600 }}>Admin</a>
          )}
          {user?.role === 'employee' && (
            <NavLink to="/employee" style={({ isActive }) => ({ color: isActive ? 'var(--primary-300)' : 'var(--nav-text)', fontWeight: 600 })}>Console</NavLink>
          )}
          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className="btn btn-primary">Sign in</NavLink>
              <ThemeToggle />
            </>
          ) : (
            user && (
              <>
                <NavLink to="/cart" className="btn btn-ghost" title="Cart" style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span role="img" aria-label="Cart">🛒</span>
                  <span>Cart</span>
                </NavLink>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-200)', display: 'grid', placeItems: 'center', color: '#000', fontWeight: 700 }}>
                      {(user.first_name?.[0] || user.username[0]).toUpperCase()}
                    </div>
                    <span style={{ color: 'var(--nav-text)', fontWeight: 600 }}>{user.first_name || user.username}</span>
                    {user.role && (
                      <span className="chip" style={{ marginLeft: 4 }}>{user.role}</span>
                    )}
                  </div>
                  <button className="btn btn-ghost" onClick={onLogout}>Logout</button>
                </div>
                <ThemeToggle />
              </>
            )
          )}
        </div>
      </div>
    </nav>
  )
}
