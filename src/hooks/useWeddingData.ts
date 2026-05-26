import { useCallback, useEffect, useState } from 'react'
import { AuthError, weddingApi } from '../api/weddingApi'
import type { DayCategoriesResponse, WeddingDay, WeddingItemDto } from '../types/api'

export function useWeddingData(token: string | null, logout: () => void) {
  const [days, setDays] = useState<WeddingDay[]>([])
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null)
  const [dayCategories, setDayCategories] = useState<DayCategoriesResponse | null>(null)
  const [items, setItems] = useState<WeddingItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDay, setLoadingDay] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((err: unknown) => {
    if (err instanceof AuthError) { logout(); return }
    setError(err instanceof Error ? err.message : 'Unknown error')
  }, [logout])

  useEffect(() => {
    if (!token) { setLoading(false); return }
    setLoading(true)
    weddingApi.days.list(token)
      .then((data) => {
        setDays(data)
        setSelectedDayId((prev) => prev ?? (data[0]?.id ?? null))
      })
      .catch(handleError)
      .finally(() => setLoading(false))
  }, [token, handleError])

  useEffect(() => {
    if (!token || !selectedDayId) {
      setDayCategories(null)
      setItems([])
      return
    }
    setLoadingDay(true)
    setError(null)
    Promise.all([
      weddingApi.categories.list(selectedDayId, token),
      weddingApi.items.listByDay(selectedDayId, token),
    ])
      .then(([cats, itemsList]) => {
        setDayCategories(cats)
        setItems(itemsList)
      })
      .catch(handleError)
      .finally(() => setLoadingDay(false))
  }, [token, selectedDayId, handleError])

  const refreshItems = useCallback(async () => {
    if (!token || !selectedDayId) return
    try {
      setItems(await weddingApi.items.listByDay(selectedDayId, token))
    } catch (err) { handleError(err) }
  }, [token, selectedDayId, handleError])

  const refreshCategories = useCallback(async () => {
    if (!token || !selectedDayId) return
    try {
      setDayCategories(await weddingApi.categories.list(selectedDayId, token))
    } catch (err) { handleError(err) }
  }, [token, selectedDayId, handleError])

  return {
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
  }
}
