import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resendVerification, getVerificationLink } from '../../api/auth'
import { useAuth } from '../../auth/AuthContext'
import '../../styles/authShell.css'
import './WelcomePage.css'

export default function WelcomePage() {
  const { user, refreshMe } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const isNew = useMemo(() => params.get('new') === '1', [params])
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const email = (user?.email || '').trim()
  const emailVerified = !!user?.email_verified

  async function resend() {
    if (!email) return
    setLoading(true)
    setStatus(null)
    try {
      await resendVerification(email)
      setStatus({ kind: 'success', text: 'Verification email sent.' })
    } catch {
      setStatus({ kind: 'error', text: 'Could not send email right now.' })
    } finally {
      setLoading(false)
    }
  }

  async function verifyNow() {
    setLoading(true)
    setStatus(null)
    try {
      const { data } = await getVerificationLink()
      const token = data?.token as string | undefined
      if (!token) {
        setStatus({ kind: 'error', text: 'Could not generate a verification link.' })
        return
      }
      navigate(`/verify-email?token=${encodeURIComponent(token)}`)
    } catch (e: any) {
      setStatus({ kind: 'error', text: e?.response?.data?.detail || 'Could not generate a verification link.' })
    } finally {
      setLoading(false)
    }
  }

  async function refreshProfile() {
    setLoading(true)
    setStatus(null)
    try {
      await refreshMe()
      setStatus({ kind: 'success', text: 'Profile refreshed.' })
    } catch {
      setStatus({ kind: 'error', text: 'Could not refresh profile.' })
    } finally {
      setLoading(false)
    }
  }

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
