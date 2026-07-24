import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import LoginPage from './pages/Login.tsx'
import RegisterPage from './pages/Register.tsx'
import EmployeeConsolePage from './pages/EmployeeConsole.tsx'
import VerifyEmailPage from './pages/VerifyEmail.tsx'
import WelcomePage from './pages/Welcome.tsx'
import HomePage from './pages/Home.tsx'
import MoviesPage from './pages/Movies.tsx'
import MovieDetailsPage from './pages/MovieDetails.tsx'
import ShowtimesPage from './pages/Showtimes.tsx'
import TheatersPage from './pages/Theaters.tsx'
import TheaterShowtimesPage from './pages/TheaterShowtimes.tsx'
import SeatSelectionPage from './pages/SeatSelectionPage.tsx'
import CartPage from './pages/Cart.tsx'
import CheckoutPage from './pages/Checkout.tsx'
import ConfirmationPage from './pages/Confirmation.tsx'
import OrdersHistoryPage from './pages/OrdersHistory.tsx'
import OrderDetailsPage from './pages/OrderDetails.tsx'
import './index.css'
import MyReviewsPage from './pages/MyReviews.tsx'
import ProfilePage from './pages/Profile.tsx'
import FavoritesPage from './pages/Favorites.tsx'
import ProtectedRoute from './auth/ProtectedRoute.tsx'

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
          <Route path="/theaters" element={<TheatersPage />} />
          <Route path="/theaters/:id/showtimes" element={<TheaterShowtimesPage />} />
          <Route path="/showtimes/:id/seats" element={<SeatSelectionPage />} />
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
          <Route path="/orders/confirmation" element={<ProtectedRoute><ConfirmationPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersHistoryPage /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailsPage /></ProtectedRoute>} />
          <Route path="/my-reviews" element={<ProtectedRoute><MyReviewsPage /></ProtectedRoute>} />
          <Route path="/my-favorites" element={<ProtectedRoute><FavoritesPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/employee" element={<ProtectedRoute><EmployeeConsolePage /></ProtectedRoute>} />
        </Routes>
      </main>
      <footer>
        <div className="container" style={{paddingBottom:24,opacity:0.8}}>
          <small>© {new Date().getFullYear()} Theater Nexus — Movie Ticketing</small>
        </div>
      </footer>
    </div>
  )
}
