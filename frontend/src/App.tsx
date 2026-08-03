import './index.css'
import AppRoutes from './routes/AppRoutes.tsx'
import { AuthProvider } from './auth/AuthContext.tsx'

function App() {
  return (
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
  )
}

export default App
