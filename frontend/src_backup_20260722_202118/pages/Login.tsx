import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import GoogleSignInButton from '../auth/GoogleSignInButton'

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await login({ email: email.trim(), password })
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-shell">
      <div className="card auth-card slide-up">
        <header className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to manage your tickets, favorites, and orders.</p>
        </header>

        <div className="provider-grid">
          <GoogleSignInButton
            mode="signin"
            onCredential={async (credential) => {
              setError(null)
              const { created } = await loginWithGoogle(credential)
              navigate(created ? '/welcome?new=1' : '/')
            }}
          />
        </div>

        <div className="auth-divider" aria-hidden="true">
          <div className="auth-divider-line" />
          <div className="auth-divider-text">or sign in with email</div>
          <div className="auth-divider-line" />
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="error" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer auth-footer--prominent">
          Don’t have an account? <Link to="/register">Create one</Link>.
        </p>
      </div>
    </section>
  )
}
