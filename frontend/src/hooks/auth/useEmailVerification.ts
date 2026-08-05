import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../../api/auth'

export type EmailVerificationStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * VerifyEmailPage's status/message state plus the effect that reads the
 * `token` query param and calls verifyEmail() on mount/token-change. Stale
 * responses are ignored the same way the original hand-rolled
 * `active` flag did.
 */
export function useEmailVerification() {
  const [params] = useSearchParams()
  const token = useMemo(() => params.get('token') || '', [params])

  const [status, setStatus] = useState<EmailVerificationStatus>('idle')
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

  return { status, message }
}
