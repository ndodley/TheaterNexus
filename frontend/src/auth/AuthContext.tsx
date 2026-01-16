import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, API_BASE } from '../api'

type Role = 'admin' | 'employee' | 'customer'

export type AuthUser = {
  id: number
  username: string
  email: string
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
  login: (params: { username?: string; email?: string; password: string }) => Promise<void>
  register: (form: FormData) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<AuthUser | null>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'mp2_auth'

function normalizeToken(token: unknown): string | null {
  if (typeof token !== 'string') return null
  const t = token.trim()
  if (!t) return null
  if (t === 'null' || t === 'undefined') return null
  return t
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

  const access = normalizeToken(state.access)
  const refresh = normalizeToken(state.refresh)
  const isAuthenticated = !!state.user && !!access

  useEffect(() => {
    const normalized: AuthState = {
      user: state.access ? state.user : null,
      access: normalizeToken(state.access),
      refresh: normalizeToken(state.refresh),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    setAuthHeader(normalized.access)
  }, [state])

  // On boot, if we have tokens but no user, hydrate via /me or try refresh
  useEffect(() => {
    async function hydrate() {
      if (access && !state.user) {
        try {
          const { data } = await api.get('/api/auth/me/')
          setState(prev => ({ ...prev, user: data }))
        } catch (err: any) {
          // Try refresh once if access expired
          if (refresh) {
            try {
              const { data } = await api.post('/api/auth/refresh/', { refresh })
              setState(prev => ({ ...prev, access: data.access }))
              const me = await api.get('/api/auth/me/')
              setState(prev => ({ ...prev, user: me.data }))
            } catch {
              setState({ user: null, access: null, refresh: null })
            }
          }
        }
      }
    }
    hydrate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Axios interceptor: on 401, attempt refresh once and retry the request
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (resp) => resp,
      async (error) => {
        if (error?.response?.status === 401 && refresh) {
          try {
            const { data } = await api.post('/api/auth/refresh/', { refresh })
            setState(prev => ({ ...prev, access: data.access }))
            setAuthHeader(data.access)
            // retry original request
            const config = error.config
            return api.request(config)
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

  const value = useMemo<AuthContextValue>(() => ({ user: state.user, isAuthenticated, login, register, logout, refreshMe }), [state.user, isAuthenticated, login, register, logout, refreshMe])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function adminUrl() {
  return `${API_BASE}/admin/`
}
