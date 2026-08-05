import { Link } from 'react-router-dom'
import GoogleSignInButton from '../../auth/GoogleSignInButton'
import { useRegisterForm } from '../../hooks/auth/useRegisterForm'
import '../../styles/authShell.css'
import './RegisterPage.css'

export default function RegisterPage() {

  const {
    email, setEmail,
    password, setPassword,
    firstName, setFirstName,
    lastName, setLastName,
    loading, error,
    onSubmit, onGoogleCredential,
  } = useRegisterForm()

  return (
    <section className="auth-shell">
      <div className="card auth-card slide-up register-card">
        <header className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Sign up to save favorites, leave reviews, and checkout faster.</p>
        </header>

        <div className="provider-grid register-providerGrid">
          <GoogleSignInButton
            mode="signup"
            onCredential={onGoogleCredential}
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
              <input type="text" autoComplete="given-name" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </label>
            <label>
              <span>Last name</span>
              <input type="text" autoComplete="family-name" value={lastName} onChange={e => setLastName(e.target.value)} />
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
          <small className="register-passwordHint">
            Password must be at least 8 characters.
          </small>

          {error && <div className="error" role="alert">{error}</div>}

          <button type="submit" className="btn btn-primary auth-btn--center" disabled={loading}>
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
