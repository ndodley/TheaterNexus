import { useEffect, useMemo, useRef, useState } from 'react'
import '../styles/authShell.css'
import './GoogleSignInButton.css'

declare global {
  interface Window {
    google?: any
  }
}

type Props = {
  onCredential: (credential: string) => Promise<void>
  mode?: 'signin' | 'signup'
}

const GOOGLE_SCRIPT_ID = 'google-identity-services'

export default function GoogleSignInButton({ onCredential, mode = 'signin' }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientId = useMemo(() => {
    const v = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID as string | undefined
    return v && v.trim() ? v.trim() : null
  }, [])

  useEffect(() => {
    if (!clientId) return

    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      setReady(true)
      return
    }

    const script = document.createElement('script')
    script.id = GOOGLE_SCRIPT_ID
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => setReady(true)
    script.onerror = () => setError('Failed to load Google sign-in')
    document.head.appendChild(script)
  }, [clientId])

  useEffect(() => {
    if (!clientId) return
    if (!ready) return
    if (!containerRef.current) return
    if (!window.google?.accounts?.id) {
      setError('Google sign-in unavailable')
      return
    }

    // Clear to avoid duplicate renders on hot reload.
    containerRef.current.innerHTML = ''

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp: any) => {
        const credential = resp?.credential
        if (!credential) {
          setError('Google sign-in failed')
          return
        }
        setError(null)
        setLoading(true)
        try {
          await onCredential(String(credential))
        } catch (e: any) {
          setError(e?.response?.data?.detail || 'Google sign-in failed')
        } finally {
          setLoading(false)
        }
      },
    })

    window.google.accounts.id.renderButton(containerRef.current, {
      theme: 'outline',
      size: 'large',
      width: 280,
      text: mode === 'signup' ? 'signup_with' : 'signin_with',
      shape: 'rectangular',
    })
  }, [clientId, ready, onCredential, mode])

  if (!clientId) {
    return (
      <button
        type="button"
        className="provider-btn"
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in"
      >
        <span className="provider-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9A6.3 6.3 0 0 1 5.7 12 6.3 6.3 0 0 1 12 5.8c1.8 0 3 .7 3.7 1.3l2.5-2.4A9.7 9.7 0 0 0 12 2.3C6.9 2.3 2.8 6.4 2.8 12S6.9 21.7 12 21.7c5.5 0 9.1-3.9 9.1-9.4 0-.6-.1-1.1-.1-1.6H12z"/>
            <path fill="#34A853" d="M3.9 7.3l3.2 2.3A6.2 6.2 0 0 1 12 5.8c1.8 0 3 .7 3.7 1.3l2.5-2.4A9.7 9.7 0 0 0 12 2.3c-3.5 0-6.6 2-8.1 5z"/>
            <path fill="#4A90E2" d="M12 21.7c2.6 0 4.7-.9 6.3-2.4l-3.1-2.5c-.8.6-1.9 1.1-3.2 1.1a6.2 6.2 0 0 1-5.8-4.1l-3.2 2.4c1.5 3.1 4.7 5.5 9 5.5z"/>
            <path fill="#FBBC05" d="M6.2 13.8c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8L3 7.9A9.7 9.7 0 0 0 2.8 12c0 1.6.4 3.1 1.1 4.4l2.3-1.7z"/>
          </svg>
        </span>
        Continue with Google
      </button>
    )
  }

  return (
    <div className="googleSignIn-wrap">
      <div ref={containerRef} />
      {loading && <small className="googleSignIn-connecting">Connecting to Google…</small>}
      {error && (
        <div className="card googleSignIn-errorCard" role="alert">
          <div className="error googleSignIn-errorText">{error}</div>
        </div>
      )}
    </div>
  )
}
