import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

/**
 * LoginPage's form state (email/password/loading/error) plus its two submit
 * paths: the email/password form and the Google credential callback. Both
 * paths call into useAuth() and then navigate, matching the page's original
 * inline handlers byte-for-byte.
 */
export function useLoginForm() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      await login({ email: email.trim(), password })
      navigate('/')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const onGoogleCredential = async (credential: string) => {
    setError(null)
    const { created } = await loginWithGoogle(credential)
    navigate(created ? '/welcome?new=1' : '/')
  }

  return {
    email, setEmail,
    password, setPassword,
    loading, error,
    onSubmit, onGoogleCredential,
  }
}
