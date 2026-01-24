import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, API_BASE } from '../api'

type Role = 'admin' | 'employee' | 'customer'

export type AuthUser = {
  id: number
  username: string
  email: string
  email_verified?: boolean
  first_name?: string
  last_name?: string
  phone_number?: string
  avatar?: string | null
  avatar_url?: string | null
  date_of_birth?: string | null
  role: Role
}

type AuthState = {
  user: AuthUser | null
  access: string | null
  refresh: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isHydrating: boolean
  login: (params: { username?: string; email?: string; password: string }) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<{ created: boolean }>
  register: (form: FormData) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'theaternexus_auth'

function normalizeToken(token: unknown): string | null {
  if (typeof token !== 'string') return null
  const t = token.trim()
  if (!t) return null
  if (t === 'null' || t === 'undefined') return null
  return t
}

function isJwtExpired(token: string, skewSeconds: number = 30): boolean {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return true
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const json = JSON.parse(atob(padded))
    const exp = typeof json?.exp === 'number' ? json.exp : 0
    if (!exp) return true
    return Date.now() >= (exp * 1000) - (skewSeconds * 1000)
  } catch {
    return true
  }
}

function normalizeAuthState(raw: unknown): AuthState {
  if (!raw || typeof raw !== 'object') return { user: null, access: null, refresh: null }
  const obj = raw as any
  const access = normalizeToken(obj.access)
  const refresh = normalizeToken(obj.refresh)
  const user = obj.user && typeof obj.user === 'object' ? (obj.user as AuthUser) : null

  // A user without a valid access token is effectively logged out.
  if (!access) {
    return { user: null, access: null, refresh: null }
  }
  return { user, access, refresh }
}

function setAuthHeader(token?: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, access: null, refresh: null }
    try {
      const parsed = JSON.parse(raw)
      const normalized = normalizeAuthState(parsed)
      setAuthHeader(normalized.access)
      return normalized
    } catch {
      return { user: null, access: null, refresh: null }
    }
  })

  const [isHydrating, setIsHydrating] = useState(true)

  const access = normalizeToken(state.access)
  const refresh = normalizeToken(state.refresh)
  // Treat a valid (non-expired) access token as authenticated.
  // User details may hydrate shortly after boot via /me.
  const isAuthenticated = !!access && !isJwtExpired(access)

  useEffect(() => {
    const normalized: AuthState = {
      user: state.access ? state.user : null,
      access: normalizeToken(state.access),
      refresh: normalizeToken(state.refresh),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    setAuthHeader(normalized.access)
  }, [state])

  // On boot, hydrate user via /me if token is valid; if access is expired and refresh exists,
  // refresh first. This avoids noisy 401s on startup.
  useEffect(() => {
    async function hydrate() {
      try {
        if (!access) return

        // If token is expired, refresh before making any authenticated calls.
        if (isJwtExpired(access)) {
          if (!refresh) {
            setState({ user: null, access: null, refresh: null })
            return
          }
          const { data } = await api.post('/api/auth/refresh/', { refresh })
          const nextAccess = normalizeToken(data?.access)
          if (!nextAccess) {
            setState({ user: null, access: null, refresh: null })
            return
          }
          setAuthHeader(nextAccess)
          setState(prev => ({ ...prev, access: nextAccess }))
        }

        // If we have a token but no user info, fetch it once.
        if (!state.user) {
          const { data } = await api.get('/api/auth/me/')
          setState(prev => ({ ...prev, user: data }))
        }
      } catch {
        // If anything goes wrong (invalid token, refresh fails, etc), clear session.
        setState({ user: null, access: null, refresh: null })
      }
    }
    hydrate().finally(() => setIsHydrating(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Axios interceptor: on 401, attempt refresh once and retry the request
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (resp) => resp,
      async (error) => {
        const originalConfig = error?.config
        const url = String(originalConfig?.url ?? '')
        const isAuthEndpoint = url.includes('/api/auth/login/') || url.includes('/api/auth/register/') || url.includes('/api/auth/refresh/') || url.includes('/api/auth/logout/')

        if (error?.response?.status === 401 && refresh && originalConfig && !originalConfig.__retry && !isAuthEndpoint) {
          try {
            originalConfig.__retry = true
            const { data } = await api.post('/api/auth/refresh/', { refresh })
            const nextAccess = normalizeToken(data?.access)
            if (!nextAccess) {
              setState({ user: null, access: null, refresh: null })
              return Promise.reject(error)
            }
            setState(prev => ({ ...prev, access: nextAccess }))
            setAuthHeader(nextAccess)
            // retry original request
            return api.request(originalConfig)
          } catch {
            setState({ user: null, access: null, refresh: null })
          }
        }
        return Promise.reject(error)
      }
    )
    return () => api.interceptors.response.eject(interceptor)
  }, [refresh])

  const login = useCallback(async ({ username, email, password }: { username?: string; email?: string; password: string }) => {
    const payload = { username: username ?? email, password }
    const { data } = await api.post('/api/auth/login/', payload)
    setState({ user: data.user, access: data.access, refresh: data.refresh })
  }, [])

  const loginWithGoogle = useCallback(async (credential: string) => {
    const { data } = await api.post('/api/auth/google/', { credential })
    setState({ user: data.user, access: data.access, refresh: data.refresh })
    return { created: !!data?.created }
  }, [])

  const register = useCallback(async (form: FormData) => {
    const { data } = await api.post('/api/auth/register/', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    // Auto-login after register
    const email = (data.email as string) || ''
    const password = (form.get('password') as string) || ''
    await login({ email, password })
  }, [login])

  const logout = useCallback(async () => {
    if (refresh) {
      try { await api.post('/api/auth/logout/', { refresh: state.refresh }) } catch {}
    }
    setState({ user: null, access: null, refresh: null })
  }, [refresh, state.refresh])

  const refreshMe = useCallback(async () => {
    if (!access) return null
    const { data } = await api.get('/api/auth/me/')
    setState(prev => ({ ...prev, user: data }))
    return data as AuthUser
  }, [access])

  const valueWithHydration = useMemo<AuthContextValue>(
    () => ({ user: state.user, isAuthenticated, isHydrating, login, loginWithGoogle, register, logout, refreshMe }),
    [state.user, isAuthenticated, isHydrating, login, loginWithGoogle, register, logout, refreshMe]
  )

  return <AuthContext.Provider value={valueWithHydration}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function adminUrl() {
  return `${API_BASE}/admin/`
}
