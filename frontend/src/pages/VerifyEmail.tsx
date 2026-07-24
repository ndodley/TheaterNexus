import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../api/auth'
import '../styles/authShell.css'
import './VerifyEmail.css'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])

  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    let active = true

    async function run() {
      if (!token) {
        if (!active) return
        setStatus('error')
        setMessage('Missing verification token. Please open the link from your email again.')
        return
      }

      if (!active) return
      setStatus('loading')
      setMessage('Verifying your email…')

      try {
        await verifyEmail(token)
        if (!active) return
        setStatus('success')
        setMessage('Email verified! Your account is ready.')
      } catch (err: any) {
        if (!active) return
        const detail = err?.response?.data?.detail
        setStatus('error')
        setMessage(typeof detail === 'string' ? detail : 'Verification failed. The link may be expired.')
      }
    }

    run()
    return () => { active = false }
  }, [token])

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
