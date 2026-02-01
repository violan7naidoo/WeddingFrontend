import { useCallback, useEffect, useState } from 'react'
import { fetchWithAuth } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type {
  CategoryDto,
  DayCategoriesResponse,
  WeddingDay,
  WeddingItemDto,
} from '../types/api'
import ItemCard from '../components/ItemCard'
import AddItemForm from '../components/AddItemForm'

export default function DashboardPage() {
  const { token, user, logout } = useAuth()
  const [days, setDays] = useState<WeddingDay[]>([])
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [dayCategories, setDayCategories] = useState<DayCategoriesResponse | null>(null)
  const [items, setItems] = useState<WeddingItemDto[]>([])
  const [addItemCategory, setAddItemCategory] = useState<CategoryDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDay, setLoadingDay] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canEdit = user?.role === 'Admin' || user?.role === 'Family'

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800">Our Big Day</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">
              {user?.displayName} ({user?.role})
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
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
            <div className="mb-6 flex gap-2 border-b border-slate-200 pb-2">
              {days.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDayId(day.id)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    selectedDayId === day.id
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
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
                <h2 className="mb-4 text-lg font-semibold text-slate-800">
                  {dayCategories.dayThemeName} – Categories & items
                </h2>
                {error && (
                  <p className="mb-4 text-sm text-red-600">{error}</p>
                )}
                <div className="space-y-8">
                  {dayCategories.categories.map((cat) => {
                    const categoryItems = items.filter((i) => i.categoryId === cat.id)
                    return (
                      <section
                        key={cat.id}
                        className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-medium text-slate-800">{cat.name}</h3>
                          {canEdit && selectedDayId && (
                            <button
                              type="button"
                              onClick={() => setAddItemCategory(cat)}
                              className="rounded bg-slate-700 px-3 py-1.5 text-sm text-white hover:bg-slate-600"
                            >
                              Add item
                            </button>
                          )}
                        </div>
                        {categoryItems.length === 0 ? (
                          <p className="text-sm text-slate-500">No items yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {categoryItems.map((item) => (
                              <ItemCard
                                key={item.id}
                                item={item}
                                canEdit={canEdit}
                                onUpdated={handleItemUpdatedOrDeleted}
                                onDeleted={handleItemUpdatedOrDeleted}
                                token={token}
                              />
                            ))}
                          </ul>
                        )}
                      </section>
                    )
                  })}
                </div>
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
