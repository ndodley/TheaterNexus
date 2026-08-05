import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { resendVerification, getVerificationLink } from '../../api/auth'
import { useAuth } from '../../auth/AuthContext'

export type WelcomeStatusMessage = { kind: 'success' | 'error'; text: string } | null

/**
 * WelcomePage's status/loading state plus its three actions: resend the
 * verification email, generate+navigate to a verification link, and
 * refresh the cached profile via useAuth()'s refreshMe. Also derives
 * `isNew` from the `?new=1` query param and the display-ready `email` /
 * `emailVerified` fields the page renders.
 */
export function useWelcomeStatus() {
  const { user, refreshMe } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const isNew = useMemo(() => params.get('new') === '1', [params])
  const [status, setStatus] = useState<WelcomeStatusMessage>(null)
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

  return {
    user, isNew,
    status, loading,
    email, emailVerified,
    resend, verifyNow, refreshProfile,
  }
}
