import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { APP_TITLE, COUPLE_DISPLAY, HERO_IMAGES } from '../config/branding'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-stretch gap-0 px-4 py-6 md:grid-cols-2 md:gap-6 md:px-6">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-rose-50 via-white to-amber-50 shadow-sm">
          <div className="absolute inset-0 opacity-20">
            <img
              src={HERO_IMAGES.flowers}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative flex h-full flex-col justify-between p-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/70 px-3 py-1 text-xs font-medium text-rose-700 backdrop-blur">
                Wedding planner
              </p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
                {APP_TITLE}
              </h1>
              <p className="mt-2 text-sm text-slate-600 md:text-base">{COUPLE_DISPLAY}</p>
              <p className="mt-6 max-w-md text-sm text-slate-600">
                Log in to manage items, vendors and costs across your wedding days — in a clean,
                spreadsheet-style dashboard.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3">
              {[HERO_IMAGES.rings, HERO_IMAGES.venue, HERO_IMAGES.flowers].map((src) => (
                <div
                  key={src}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <img
                    src={src}
                    alt=""
                    className="h-24 w-full object-cover md:h-28"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">
                Sign in to access the planner dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-rose-600 to-amber-500 py-2.5 font-medium text-white shadow-sm hover:from-rose-500 hover:to-amber-400 disabled:opacity-50"
              >
                {loading ? 'Please wait…' : 'Sign in'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  )
}
