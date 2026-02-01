import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { fetchWithAuth } from '../api/client'

export interface AuthUser {
  email: string
  role: string
  displayName: string
}

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  setAuth: (token: string, user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'ourbigday_auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const { token: t, user: u } = JSON.parse(raw) as { token: string; user: AuthUser }
        if (t && u) {
          setToken(t)
          setUser(u)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const persist = useCallback((t: string, u: AuthUser) => {
    setToken(t)
    setUser(u)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }))
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetchWithAuth('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Login failed')
      }
      const data = await res.json()
      persist(data.token, {
        email: data.email,
        role: data.role ?? 'Family',
        displayName: data.displayName ?? email,
      })
    },
    [persist]
  )

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const res = await fetchWithAuth('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName, role: 'Family' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const msg = Array.isArray(data) ? data.join(' ') : data.message ?? 'Register failed'
        throw new Error(msg)
      }
      const data = await res.json()
      persist(data.token, {
        email: data.email,
        role: data.role ?? 'Family',
        displayName: data.displayName ?? displayName,
      })
    },
    [persist]
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const setAuth = useCallback(
    (t: string, u: AuthUser) => persist(t, u),
    [persist]
  )

  return (
    <AuthContext.Provider
      value={{ token, user, loading, login, register, logout, setAuth }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
