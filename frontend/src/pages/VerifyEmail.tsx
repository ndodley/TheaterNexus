import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api'

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
        await api.post('/api/auth/verify-email/', { token })
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
      <div className="card auth-card slide-up" style={{ maxWidth: 560 }}>
        <header className="auth-header">
          <h1 className="auth-title">Verify your email</h1>
          <p className="auth-subtitle">One last step to finish setting up your account.</p>
        </header>

        <div className="card" style={{ background: '#f8fafc', borderColor: '#e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                display: 'grid',
                placeItems: 'center',
                background:
                  status === 'success'
                    ? 'rgba(34,197,94,0.12)'
                    : status === 'error'
                      ? 'rgba(239,68,68,0.10)'
                      : 'rgba(99,102,241,0.10)',
                border:
                  status === 'success'
                    ? '1px solid rgba(34,197,94,0.25)'
                    : status === 'error'
                      ? '1px solid rgba(239,68,68,0.20)'
                      : '1px solid rgba(99,102,241,0.22)',
              }}
            >
              {status === 'success' ? (
                <span style={{ fontWeight: 900, color: '#16a34a' }}>✓</span>
              ) : status === 'error' ? (
                <span style={{ fontWeight: 900, color: '#ef4444' }}>!</span>
              ) : (
                <span style={{ fontWeight: 900, color: '#4f46e5' }}>…</span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>{message}</div>
              {status === 'loading' && (
                <div style={{ opacity: 0.8, marginTop: 4, fontSize: 13 }}>
                  This should only take a second.
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {status === 'success' ? (
            <Link className="btn btn-primary" to="/" style={{ justifyContent: 'center' }}>
              Continue
            </Link>
          ) : (
            <Link className="btn btn-primary" to="/login" style={{ justifyContent: 'center' }}>
              Back to sign in
            </Link>
          )}
          <Link className="btn" to="/" style={{ justifyContent: 'center' }}>
            Home
          </Link>
        </div>

        <p className="auth-footer" style={{ textAlign: 'center' }}>
          Didn’t request this? You can ignore it.
        </p>
      </div>
    </section>
  )
}
