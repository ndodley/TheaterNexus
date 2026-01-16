import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle.tsx'
import { useAuth, adminUrl } from '../auth/AuthContext.tsx'
import { useEffect, useRef, useState } from 'react'
import { imageUrl } from '../api.ts'

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const navRef = useRef<HTMLDivElement | null>(null)

  const onLogout = async () => {
    await logout()
    navigate('/')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      if (!menuRef.current) return
      if (isAccountOpen && !menuRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false)
      }
      if (navRef.current && isNavOpen && !navRef.current.contains(e.target as Node)) {
        setIsNavOpen(false)
      }
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [isAccountOpen])

  return (
    <nav className="nav" style={{ background: 'var(--nav-bg)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--border)', position:'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link to="/" className="logo" style={{ fontWeight: 800, fontSize: 20, color: 'var(--nav-text)' }} aria-label="MP2 Home">MP2 Tickets</Link>
          <div className="nav-links">
            <NavLink to="/movies" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="mi-icon" aria-hidden>🎬</span><span>Movies</span>
            </NavLink>
            <NavLink to="/showtimes" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="mi-icon" aria-hidden>🕒</span><span>Showtimes</span>
            </NavLink>
            <NavLink to="/theaters" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="mi-icon" aria-hidden>🎟️</span><span>Theaters</span>
            </NavLink>
          </div>
          <button className="menu-toggle" aria-label="Open menu" onClick={() => setIsNavOpen(v => !v)}>
            <span aria-hidden>☰</span>
            <span>Menu</span>
          </button>

        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user?.role === 'admin' && (
            <a href={adminUrl()} target="_blank" rel="noreferrer" className="nav-link">Admin</a>
          )}
          {user?.role === 'employee' && (
            <NavLink to="/employee" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Console</NavLink>
          )}
          {!isAuthenticated ? (
            <>
              <NavLink to="/login" className="btn btn-primary">Sign in</NavLink>
              <ThemeToggle />
            </>
          ) : (
            user && (
              <>
                <NavLink to="/cart" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} cart-link`} title="Cart">
                  <span className="mi-icon" aria-hidden>🛒</span><span>Cart</span>
                </NavLink>
                <div ref={menuRef} className="account-menu" style={{ position:'relative', zIndex: 10000 }}>
                  <button
                    className="account-toggle"
                    aria-haspopup="menu"
                    aria-expanded={isAccountOpen}
                    onClick={() => setIsAccountOpen(v => !v)}
                    title="My Account"
                    style={{ display:'inline-flex', alignItems:'center', gap:10 }}
                  >
                    {(() => {
                      const avatarSrc = user?.avatar_url ? imageUrl(user.avatar_url) : (user?.avatar ? imageUrl(user.avatar) : imageUrl('/media/default_poster/default_avatar.jpg'))
                      return (
                        <img src={avatarSrc} alt={user?.username || ''} style={{ width:28, height:28, borderRadius:'50%', objectFit:'cover', boxShadow:'var(--shadow)' }} />
                      )
                    })()}
                    <span style={{ color:'var(--nav-text)', fontWeight:700 }}>{user.first_name || user.username}</span>
                    <span className="caret" aria-hidden>▾</span>
                  </button>
                  {isAccountOpen && (
                    <div
                      role="menu"
                      className="account-dropdown slide-up"
                      style={{ position:'absolute', right:0, top:'calc(100% + 8px)', minWidth:220 }}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <div className="menu-group">
                        <button role="menuitem" className="menu-item" onClick={() => { setIsAccountOpen(false); navigate('/profile') }}>
                          <span className="mi-icon" aria-hidden>👤</span><span>Profile</span>
                        </button>
                        <button role="menuitem" className="menu-item" onClick={() => { setIsAccountOpen(false); navigate('/orders') }}>
                          <span className="mi-icon" aria-hidden>📦</span><span>My Orders</span>
                        </button>
                        <button role="menuitem" className="menu-item" onClick={() => { setIsAccountOpen(false); navigate('/my-reviews') }}>
                          <span className="mi-icon" aria-hidden>✍️</span><span>My Reviews</span>
                        </button>
                        <button role="menuitem" className="menu-item" onClick={() => { setIsAccountOpen(false); navigate('/my-favorites') }}>
                          <span className="mi-icon" aria-hidden>❤️</span><span>My Favorites</span>
                        </button>
                      </div>
                      <div className="menu-divider" />
                      <button role="menuitem" className="menu-item" onClick={onLogout}>
                        <span className="mi-icon" aria-hidden>🚪</span><span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
                <ThemeToggle />
              </>
            )
          )}
        </div>

        {isNavOpen && (
          <div ref={navRef} className="mobile-menu slide-up">
            <button className="menu-item" onClick={() => { setIsNavOpen(false); navigate('/movies') }}>
              <span className="mi-icon" aria-hidden>🎬</span><span>Movies</span>
            </button>
            <button className="menu-item" onClick={() => { setIsNavOpen(false); navigate('/showtimes') }}>
              <span className="mi-icon" aria-hidden>🕒</span><span>Showtimes</span>
            </button>
            <button className="menu-item" onClick={() => { setIsNavOpen(false); navigate('/theaters') }}>
              <span className="mi-icon" aria-hidden>🎟️</span><span>Theaters</span>
            </button>
            {!isAuthenticated ? (
              <button className="menu-item" onClick={() => { setIsNavOpen(false); navigate('/login') }}>
                <span className="mi-icon" aria-hidden>🔐</span><span>Sign in</span>
              </button>
            ) : (
              <>
                <button className="menu-item" onClick={() => { setIsNavOpen(false); navigate('/cart') }}>
                  <span className="mi-icon" aria-hidden>🛒</span><span>Cart</span>
                </button>
                {user?.role === 'admin' && (
                  <a className="menu-item" href={adminUrl()} target="_blank" rel="noreferrer">
                    <span className="mi-icon" aria-hidden>🛠️</span><span>Admin</span>
                  </a>
                )}
                {user?.role === 'employee' && (
                  <button className="menu-item" onClick={() => { setIsNavOpen(false); navigate('/employee') }}>
                    <span className="mi-icon" aria-hidden>💻</span><span>Console</span>
                  </button>
                )}
                <button className="menu-item" onClick={() => { setIsNavOpen(false); setIsAccountOpen(true) }}>
                  <span className="mi-icon" aria-hidden>👤</span><span>My Account</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
