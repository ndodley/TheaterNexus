import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import GoogleSignInButton from '../auth/GoogleSignInButton'

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const form = new FormData()
      form.append('email', email.trim())
      form.append('password', password)
      if (firstName) form.append('first_name', firstName)
      if (lastName) form.append('last_name', lastName)
      await register(form)
      navigate('/welcome?new=1')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-shell">
      <div className="card auth-card slide-up" style={{ width: 'min(560px, 100%)' }}>
        <header className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Sign up to save favorites, leave reviews, and checkout faster.</p>
        </header>

        <div className="provider-grid" style={{ maxWidth: 420 }}>
          <GoogleSignInButton
            mode="signup"
            onCredential={async (credential) => {
              setError(null)
              const { created } = await loginWithGoogle(credential)
              navigate(created ? '/welcome?new=1' : '/')
            }}
          />
        </div>

        <div className="auth-divider" aria-hidden="true">
          <div className="auth-divider-line" />
          <div className="auth-divider-text">or create an account with email</div>
          <div className="auth-divider-line" />
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="grid-2">
            <label>
              <span>First name</span>
              <input autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </label>
            <label>
              <span>Last name</span>
              <input autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} />
            </label>
          </div>
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
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </label>
          <small style={{ opacity: 0.75 }}>
            Password must be at least 8 characters.
          </small>

          {error && <div className="error" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer auth-footer--prominent">
          Already have an account? <Link to="/login">Sign in</Link>.
        </p>
      </div>
    </section>
  )
}
