import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.tsx'
import Footer from './Footer.tsx'
import './Layout.css'

/**
 * Shared page shell used by every route: navbar on top, the routed page
 * content in the middle (via <Outlet />), and Footer pinned to the
 * bottom. All pages inherit this automatically through AppRoutes' layout
 * route, so no page file needs to import or wrap anything itself.
 */
export default function Layout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
