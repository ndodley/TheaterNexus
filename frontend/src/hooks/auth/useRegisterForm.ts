import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

/**
 * RegisterPage's form state (email/password/firstName/lastName/loading/error)
 * plus its two submit paths: the email/password form (builds the FormData
 * payload register() expects) and the Google credential callback. Mirrors
 * useLoginForm's shape so both auth pages wire up the same way.
 */
export function useRegisterForm() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null); setLoading(true)

    try {
      const form = new FormData()
      form.append('email', email.trim())
      form.append('password', password)

      if (firstName) {
        form.append('first_name', firstName)
      }

      if (lastName) {
        form.append('last_name', lastName)
      }

      await register(form)
      navigate('/welcome?new=1')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed')
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
    firstName, setFirstName,
    lastName, setLastName,
    loading, error,
    onSubmit, onGoogleCredential,
  }
}
