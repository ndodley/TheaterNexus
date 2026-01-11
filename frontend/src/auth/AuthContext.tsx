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
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'mp2_auth'

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
      const parsed: AuthState = JSON.parse(raw)
      setAuthHeader(parsed.access)
      return parsed
    } catch {
      return { user: null, access: null, refresh: null }
    }
  })

  const isAuthenticated = !!state.user && !!state.access

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    setAuthHeader(state.access)
  }, [state])

  // On boot, if we have tokens but no user, hydrate via /me or try refresh
  useEffect(() => {
    async function hydrate() {
      if (state.access && !state.user) {
        try {
          const { data } = await api.get('/api/auth/me/')
          setState(prev => ({ ...prev, user: data }))
        } catch (err: any) {
          // Try refresh once if access expired
          if (state.refresh) {
            try {
              const { data } = await api.post('/api/auth/refresh/', { refresh: state.refresh })
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
        if (error?.response?.status === 401 && state.refresh) {
          try {
            const { data } = await api.post('/api/auth/refresh/', { refresh: state.refresh })
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
  }, [state.refresh])

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
    if (state.refresh) {
      try { await api.post('/api/auth/logout/', { refresh: state.refresh }) } catch {}
    }
    setState({ user: null, access: null, refresh: null })
  }, [state.refresh])

  const value = useMemo<AuthContextValue>(() => ({ user: state.user, isAuthenticated, login, register, logout }), [state.user, isAuthenticated, login, register, logout])

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
