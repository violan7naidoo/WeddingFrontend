import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isRegister) {
        await register(email, password, displayName)
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-2xl font-semibold text-slate-800">
          Our Big Day
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          Sign in to access the wedding planner dashboard.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
                placeholder="Your name"
                required={isRegister}
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-800 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? 'Please wait…' : isRegister ? 'Register' : 'Sign in'}
          </button>
        </form>
        <button
          type="button"
          onClick={() => { setIsRegister(!isRegister); setError(null); }}
          className="mt-4 w-full text-sm text-slate-500 hover:text-slate-700"
        >
          {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
        </button>
        <p className="mt-6 text-xs text-slate-400">
          Demo: admin@ourbigday.com / Admin123!
        </p>
      </div>
    </div>
  )
}
