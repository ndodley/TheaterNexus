import { Link } from 'react-router-dom'
import './Footer.css'

/**
 * Site-wide footer rendered by Layout on every page (via AppRoutes' layout
 * route), right alongside Navbar. Only links to routes that actually exist
 * in AppRoutes -- ProtectedRoute already handles bouncing signed-out
 * visitors to /login if they follow one of the account links below.
 */
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-brand">
            <Link to="/" className="site-footer-logo">Theater Nexus</Link>
            <p className="site-footer-tagline">
              Your modern movie ticketing experience. Browse films, explore
              details, and book with ease.
            </p>
          </div>

          <nav className="site-footer-col" aria-label="Explore">
            <span className="site-footer-heading">Explore</span>
            <Link to="/movies">Movies</Link>
            <Link to="/showtimes">Showtimes</Link>
            <Link to="/theaters">Theaters</Link>
          </nav>

          <nav className="site-footer-col" aria-label="Account">
            <span className="site-footer-heading">Account</span>
            <Link to="/profile">My Profile</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/my-favorites">My Favorites</Link>
          </nav>
        </div>

        <div className="site-footer-bottom">
          <small>© {new Date().getFullYear()} Theater Nexus — Movie Ticketing</small>
        </div>
      </div>
    </footer>
  )
}
