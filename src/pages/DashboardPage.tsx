import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import type { CategoryDto } from '../types/api'
import AddItemForm from '../components/AddItemForm'
import ItemsSheet from '../components/ItemsSheet'
import DayTabs from '../components/DayTabs'
import NewTableBar from '../components/NewTableBar'
import { useWeddingData } from '../hooks/useWeddingData'
import { APP_TITLE, COUPLE_DISPLAY, SLIDER_IMAGES } from '../config/branding'

export default function DashboardPage() {
  const { token, user, logout } = useAuth()
  const {
    days,
    selectedDayId,
    setSelectedDayId,
    dayCategories,
    items,
    loading,
    loadingDay,
    error,
    refreshItems,
    refreshCategories,
  } = useWeddingData(token, logout)

  const [addItemCategory, setAddItemCategory] = useState<CategoryDto | null>(null)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const canEdit = user?.role === 'Admin' || user?.role === 'Family'

  const selectedDay = useMemo(
    () => days.find((d) => d.id === selectedDayId),
    [days, selectedDayId]
  )
  const [currentSlide, setCurrentSlide] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrentSlide(i => (i + 1) % SLIDER_IMAGES.length)
        setVisible(true)
      }, 600)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-slate-900">{APP_TITLE}</h1>
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
              src={SLIDER_IMAGES[currentSlide]}
              alt=""
              className={`h-full w-full object-cover transition-opacity duration-700 ${visible ? 'opacity-30' : 'opacity-0'}`}
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
            <DayTabs days={days} selectedDayId={selectedDayId} onSelect={setSelectedDayId} />

            {canEdit && selectedDayId && token && (
              <NewTableBar dayId={selectedDayId} token={token} onCreated={refreshCategories} />
            )}

            {loadingDay ? (
              <p className="text-slate-600">Loading day…</p>
            ) : selectedDay && dayCategories && token ? (
              <div>
                {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
                <ItemsSheet
                  dayId={selectedDayId!}
                  categories={dayCategories.categories}
                  items={items}
                  canEdit={canEdit}
                  token={token}
                  onAddItem={(cat) => setAddItemCategory(cat)}
                  onUpdatedOrDeleted={refreshItems}
                  onCategoryDeleted={refreshCategories}
                  searchQuery={deferredSearch}
                />
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
          onCreated={() => { setAddItemCategory(null); refreshItems() }}
        />
      )}
    </div>
  )
}
