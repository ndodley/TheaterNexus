import { Link } from 'react-router-dom'
import { useWelcomeStatus } from '../../hooks/auth/useWelcomeStatus'
import '../../styles/authShell.css'
import './WelcomePage.css'

export default function WelcomePage() {
  const {
    user, isNew,
    status, loading,
    email, emailVerified,
    resend, verifyNow, refreshProfile,
  } = useWelcomeStatus()

  return (
    <section className="auth-shell">
      <div className="card auth-card slide-up welcome-card">
        <header className="auth-header">
          <h1 className="auth-title">Welcome{user?.first_name ? `, ${user.first_name}` : ''}</h1>
          <p className="auth-subtitle">
            {isNew ? 'Your account is ready.' : 'You’re signed in.'}{' '}
            {emailVerified ? 'Your email is verified.' : 'Please verify your email to complete setup.'}
          </p>
        </header>

        <div className="card welcome-statusBanner">
          <div className="welcome-statusRow">
            <div
              aria-hidden="true"
              className={`welcome-statusIcon ${emailVerified ? 'welcome-statusIcon--verified' : 'welcome-statusIcon--pending'}`}
            >
              {emailVerified ? '✓' : '↗'}
            </div>
            <div className="welcome-statusBody">
              <div className="welcome-statusTitle">
                {emailVerified ? 'Email verified' : 'Email verification available'}
              </div>
              <div className="welcome-statusEmail">
                {email ? (
                  <>Email: <strong>{email}</strong></>
                ) : (
                  <>No email on file.</>
                )}
              </div>
              <div className="welcome-statusHint">
                {!emailVerified ? (
                  <>Check your inbox (and spam/junk) for the verification email.</>
                ) : (
                  <>Thanks for verifying — you’re all set.</>
                )}
              </div>
            </div>
          </div>
        </div>

        {status && (
          <div
            className={`card welcome-statusMsg ${status.kind === 'success' ? 'welcome-statusMsg--success' : 'welcome-statusMsg--error'}`}
            role="status"
          >
            <div className="welcome-statusMsgText">{status.text}</div>
          </div>
        )}

        <div className="welcome-actions">
          {!emailVerified ? (
            <>
              <button className="btn btn-primary" onClick={verifyNow} disabled={loading || !email}>
                Verify email
              </button>
              <button className="btn" onClick={resend} disabled={loading || !email}>
                Resend email
              </button>
            </>
          ) : (
            <Link className="btn btn-primary" to="/">
              Continue
            </Link>
          )}
          <button className="btn" onClick={refreshProfile} disabled={loading}>
            Refresh profile
          </button>
          {!emailVerified && (
            <Link className="btn" to="/">
              Continue
            </Link>
          )}
        </div>

        <p className="auth-footer auth-footer--center">
          Want to see your account details? <Link to="/profile">Go to profile</Link>.
        </p>
      </div>
    </section>
  )
}
