import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import HomePage from './pages/Home.tsx'
import MoviesPage from './pages/Movies.tsx'
import MovieDetailsPage from './pages/MovieDetails.tsx'
import './index.css'

export default function App() {
  return (
    <div id="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/movies/:id" element={<MovieDetailsPage />} />
        </Routes>
      </main>
      <footer>
        <div className="container" style={{paddingBottom:24,opacity:0.8}}>
          <small>© {new Date().getFullYear()} MP2 — Movie Ticketing</small>
        </div>
      </footer>
    </div>
  )
}
