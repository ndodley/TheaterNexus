import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../components/common/Layout.tsx'
import HomePage from '../pages/HomePage.tsx'
import MoviesPage from '../pages/moviepages/MoviesPage.tsx'
import MovieDetailsPage from '../pages/moviepages/MovieDetailsPage.tsx'
import ShowtimesPage from '../pages/ShowtimesPage.tsx'
import TheatersPage from '../pages/theaterpages/TheatersPage.tsx'
import TheaterShowtimesPage from '../pages/theaterpages/TheaterShowtimesPage.tsx'
import SeatSelectionPage from '../pages/moviepages/SeatSelectionPage.tsx'
import CartPage from '../pages/checkoutpages/CartPage.tsx'
import CheckoutPage from '../pages/checkoutpages/CheckoutPage.tsx'
import ConfirmationPage from '../pages/checkoutpages/ConfirmationPage.tsx'
import MyProfilePage from '../pages/mypages/MyProfilePage.tsx'
import MyOrdersPage from '../pages/mypages/MyOrdersPage.tsx'
import MyOrderDetailsPage from '../pages/mypages/MyOrderDetailsPage.tsx'
import MyReviewsPage from '../pages/mypages/MyReviewsPage.tsx'
import MyFavoritesPage from '../pages/mypages/MyFavoritesPage.tsx'
import LoginPage from '../pages/loginpages/LoginPage.tsx'
import RegisterPage from '../pages/loginpages/RegisterPage.tsx'
import WelcomePage from '../pages/loginpages/WelcomePage.tsx'
import VerifyEmailPage from '../pages/loginpages/VerifyEmailPage.tsx'
import EmployeeConsolePage from '../pages/EmployeeConsolePage.tsx'
import ProtectedRoute from '../auth/ProtectedRoute.tsx'

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Layout owns the Navbar + footer chrome; every child route
                    below renders into Layout's <Outlet />, so pages inherit
                    the shared shell automatically without importing anything. */}
                <Route element={<Layout />}>
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
                    <Route path="/orders" element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
                    <Route path="/orders/:id" element={<ProtectedRoute><MyOrderDetailsPage /></ProtectedRoute>} />

                    {/* My Personal Pages */}
                    <Route path="/my-reviews" element={<ProtectedRoute><MyReviewsPage /></ProtectedRoute>} />
                    <Route path="/my-favorites" element={<ProtectedRoute><MyFavoritesPage /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><MyProfilePage /></ProtectedRoute>} />

                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />

                    <Route path="/employee" element={<ProtectedRoute><EmployeeConsolePage /></ProtectedRoute>} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes
