import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { fetchWithAuth } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type {
  CategoryDto,
  DayCategoriesResponse,
  WeddingDay,
  WeddingItemDto,
} from '../types/api'
import AddItemForm from '../components/AddItemForm'
import ItemsSheet from '../components/ItemsSheet'
import { APP_TITLE, COUPLE_DISPLAY, HERO_IMAGES } from '../config/branding'

export default function DashboardPage() {
  const { token, user, logout } = useAuth()
  const [days, setDays] = useState<WeddingDay[]>([])
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [dayCategories, setDayCategories] = useState<DayCategoriesResponse | null>(null)
  const [items, setItems] = useState<WeddingItemDto[]>([])
  const [addItemCategory, setAddItemCategory] = useState<CategoryDto | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingDay, setLoadingDay] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canEdit = user?.role === 'Admin' || user?.role === 'Family'
  const deferredSearch = useDeferredValue(search)

  const loadDays = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchWithAuth('/api/wedding/days', { token })
      if (res.status === 401) {
        logout()
        return
      }
      if (!res.ok) throw new Error('Failed to load days')
      const data: WeddingDay[] = await res.json()
      setDays(data)
      if (data.length > 0 && !selectedDayId) setSelectedDayId(data[0].id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading days')
    } finally {
      setLoading(false)
    }
  }, [token, selectedDayId, logout])

  useEffect(() => {
    loadDays()
  }, [loadDays])

  useEffect(() => {
    if (!token || !selectedDayId) {
      setDayCategories(null)
      setItems([])
      return
    }
    setLoadingDay(true)
    setError(null)
    Promise.all([
      fetchWithAuth(`/api/wedding/days/${selectedDayId}/categories`, { token }).then((r) => {
        if (r.status === 401) {
          logout()
          return Promise.reject(new Error('Session expired'))
        }
        return r.ok ? r.json() : Promise.reject(new Error('Failed to load categories'))
      }),
      fetchWithAuth(`/api/wedding/days/${selectedDayId}/items`, { token }).then((r) => {
        if (r.status === 401) {
          logout()
          return Promise.reject(new Error('Session expired'))
        }
        return r.ok ? r.json() : Promise.reject(new Error('Failed to load items'))
      }),
    ])
      .then(([cats, itemsList]: [DayCategoriesResponse, WeddingItemDto[]]) => {
        setDayCategories(cats)
        setItems(itemsList)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoadingDay(false))
  }, [token, selectedDayId, logout])

  const refreshItems = useCallback(async () => {
    if (!token || !selectedDayId) return
    const res = await fetchWithAuth(`/api/wedding/days/${selectedDayId}/items`, { token })
    if (res.ok) setItems(await res.json())
  }, [token, selectedDayId])

  const handleItemCreated = useCallback(() => {
    setAddItemCategory(null)
    refreshItems()
  }, [refreshItems])

  const handleItemUpdatedOrDeleted = useCallback(() => {
    refreshItems()
  }, [refreshItems])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading…</p>
      </div>
    )
  }

  if (error && !dayCategories) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => loadDays()}
          className="rounded-lg bg-slate-700 px-4 py-2 text-white hover:bg-slate-600"
        >
          Retry
        </button>
      </div>
    )
  }

  const selectedDay = days.find((d) => d.id === selectedDayId)
  const heroImage = useMemo(() => {
    const theme = (selectedDay?.themeName ?? '').toLowerCase()
    if (theme.includes('sangeet')) return HERO_IMAGES.flowers
    if (theme.includes('night')) return HERO_IMAGES.venue
    if (theme.includes('christian')) return HERO_IMAGES.rings
    return HERO_IMAGES.flowers
  }, [selectedDay?.themeName])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-slate-900">
                {APP_TITLE}
              </h1>
              <p className="mt-0.5 text-sm text-slate-600">{COUPLE_DISPLAY}</p>
            </div>
            <div className="flex items-center justify-between gap-4 md:justify-end">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-800">{user?.displayName}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt=""
              className="h-full w-full object-cover opacity-20"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-rose-700">
                Planner dashboard
              </p>
              <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">
                {selectedDay ? `${selectedDay.themeName} — Day ${selectedDay.dayNumber}` : 'Select a day'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Spreadsheet-style rows for vendors, costs, deposits, and completion.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[360px]">
              <label className="text-xs font-medium text-slate-600">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                placeholder="Search items, vendors, notes…"
              />
              {deferredSearch.trim() !== search.trim() && (
                <p className="text-xs text-slate-500">Filtering…</p>
              )}
            </div>
          </div>
        </section>

        {user?.role === 'Guest' ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Schedule</h2>
            <p className="mb-4 text-sm text-slate-500">
              You have read-only access. Here are the wedding days.
            </p>
            <ul className="space-y-3">
              {days.map((day) => (
                <li
                  key={day.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span className="font-medium text-slate-700">Day {day.dayNumber}</span>
                  <span className="text-slate-600"> – {day.themeName}</span>
                  <span className="ml-2 text-sm text-slate-500">{day.date}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {days.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDayId(day.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selectedDayId === day.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {day.themeName}
                </button>
              ))}
            </div>

            {loadingDay ? (
              <p className="text-slate-600">Loading day…</p>
            ) : selectedDay && dayCategories ? (
              <div>
                {error && (
                  <p className="mb-4 text-sm text-red-600">{error}</p>
                )}
                {token && (
                  <ItemsSheet
                    categories={dayCategories.categories}
                    items={items}
                    canEdit={canEdit}
                    token={token}
                    onAddItem={(cat) => setAddItemCategory(cat)}
                    onUpdatedOrDeleted={handleItemUpdatedOrDeleted}
                    searchQuery={deferredSearch}
                  />
                )}
              </div>
            ) : null}
          </>
        )}
      </main>

      {addItemCategory && selectedDayId && token && (
        <AddItemForm
          dayId={selectedDayId}
          category={addItemCategory}
          token={token}
          onClose={() => setAddItemCategory(null)}
          onCreated={handleItemCreated}
        />
      )}
    </div>
  )
}
