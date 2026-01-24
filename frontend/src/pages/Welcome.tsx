import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth/AuthContext'

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
      await api.post('/api/auth/resend-verification/', { email })
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
      const { data } = await api.get('/api/auth/verification-link/')
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
      <div className="card auth-card slide-up" style={{ maxWidth: 720 }}>
        <header className="auth-header">
          <h1 className="auth-title">Welcome{user?.first_name ? `, ${user.first_name}` : ''}</h1>
          <p className="auth-subtitle">
            {isNew ? 'Your account is ready.' : 'You’re signed in.'}{' '}
            {emailVerified ? 'Your email is verified.' : 'Please verify your email to complete setup.'}
          </p>
        </header>

        <div className="card" style={{ background: '#0b1220', color: '#e5e7eb', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div
              aria-hidden="true"
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background: emailVerified ? 'rgba(34,197,94,0.14)' : 'rgba(99,102,241,0.16)',
                border: emailVerified ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(99,102,241,0.35)',
                color: emailVerified ? '#bbf7d0' : '#c7d2fe',
                fontWeight: 900,
              }}
            >
              {emailVerified ? '✓' : '↗'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>
                {emailVerified ? 'Email verified' : 'Email verification available'}
              </div>
              <div style={{ opacity: 0.85, marginTop: 2 }}>
                {email ? (
                  <>Email: <strong>{email}</strong></>
                ) : (
                  <>No email on file.</>
                )}
              </div>
              <div style={{ opacity: 0.75, marginTop: 6, fontSize: 13 }}>
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
            className="card"
            style={{
              padding: 12,
              borderColor:
                status.kind === 'success' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)',
              background: status.kind === 'success' ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
            }}
            role="status"
          >
            <div style={{ margin: 0, fontWeight: 700 }}>{status.text}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
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

        <p className="auth-footer" style={{ textAlign: 'center' }}>
          Want to see your account details? <Link to="/profile">Go to profile</Link>.
        </p>
      </div>
    </section>
  )
}
