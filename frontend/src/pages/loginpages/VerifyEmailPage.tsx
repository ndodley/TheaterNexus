import { Link } from 'react-router-dom'
import { useEmailVerification } from '../../hooks/auth/useEmailVerification'
import '../../styles/authShell.css'
import './VerifyEmailPage.css'

export default function VerifyEmailPage() {
  const { status, message } = useEmailVerification()

  return (
    <section className="auth-shell">
      <div className="card auth-card slide-up verifyEmail-card">
        <header className="auth-header">
          <h1 className="auth-title">Verify your email</h1>
          <p className="auth-subtitle">One last step to finish setting up your account.</p>
        </header>

        <div className="card verifyEmail-statusBanner">
          <div className="verifyEmail-statusRow">
            <div
              aria-hidden="true"
              className={`verifyEmail-statusIcon verifyEmail-statusIcon--${status === 'success' ? 'success' : status === 'error' ? 'error' : 'loading'}`}
            >
              {status === 'success' ? (
                <span className="verifyEmail-statusGlyph--success">✓</span>
              ) : status === 'error' ? (
                <span className="verifyEmail-statusGlyph--error">!</span>
              ) : (
                <span className="verifyEmail-statusGlyph--loading">…</span>
              )}
            </div>

            <div className="verifyEmail-statusBody">
              <div className="verifyEmail-statusTitle">{message}</div>
              {status === 'loading' && (
                <div className="verifyEmail-statusSubtext">
                  This should only take a second.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="verifyEmail-actions">
          {status === 'success' ? (
            <Link className="btn btn-primary auth-btn--center" to="/">
              Continue
            </Link>
          ) : (
            <Link className="btn btn-primary auth-btn--center" to="/login">
              Back to sign in
            </Link>
          )}
          <Link className="btn auth-btn--center" to="/">
            Home
          </Link>
        </div>

        <p className="auth-footer auth-footer--center">
          Didn’t request this? You can ignore it.
        </p>
      </div>
    </section>
  )
}
