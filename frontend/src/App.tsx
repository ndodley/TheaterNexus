import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import LoginPage from './pages/Login.tsx'
import RegisterPage from './pages/Register.tsx'
import EmployeeConsolePage from './pages/EmployeeConsole.tsx'
import HomePage from './pages/Home.tsx'
import MoviesPage from './pages/Movies.tsx'
import MovieDetailsPage from './pages/MovieDetails.tsx'
import ShowtimesPage from './pages/Showtimes.tsx'
import SeatSelectionPage from './pages/SeatSelection.tsx'
import CartPage from './pages/Cart.tsx'
import CheckoutPage from './pages/Checkout.tsx'
import ConfirmationPage from './pages/Confirmation.tsx'
import OrdersHistoryPage from './pages/OrdersHistory.tsx'
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
          <Route path="/showtimes" element={<ShowtimesPage />} />
          <Route path="/showtimes/:id/seats" element={<SeatSelectionPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/confirmation" element={<ConfirmationPage />} />
          <Route path="/orders" element={<OrdersHistoryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/employee" element={<EmployeeConsolePage />} />
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
