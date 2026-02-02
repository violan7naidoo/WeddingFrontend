import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '../api/client'
import { APP_TITLE } from '../config/branding'

export interface WeddingDay {
  id: number
  dayNumber: number
  themeName: string
  date: string
}

export default function DaysPage() {
  const [days, setDays] = useState<WeddingDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/api/wedding/days`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data: WeddingDay[]) => setDays(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-600">Loading wedding days…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-red-600">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold text-slate-800">
        {APP_TITLE} – Wedding Days
      </h1>
      <ul className="space-y-4">
        {days.map((day) => (
          <li
            key={day.id}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <span className="font-medium text-slate-700">
              Day {day.dayNumber}
            </span>
            <span className="text-slate-600"> – {day.themeName}</span>
            <span className="ml-2 text-sm text-slate-500">{day.date}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
