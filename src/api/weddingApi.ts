import { fetchWithAuth } from './client'
import type {
  AddPaymentRequest,
  CategoryDto,
  CreateWeddingItemRequest,
  DayCategoriesResponse,
  UpdateWeddingItemRequest,
  WeddingDay,
  WeddingItemDto,
} from '../types/api'

export class AuthError extends Error {
  constructor() {
    super('Session expired')
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleResponse(res: Response): Promise<any> {
  if (res.status === 401) throw new AuthError()
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Request failed (${res.status})`)
  }
  return res.json()
}

async function handleDelete(res: Response): Promise<void> {
  if (res.status === 401) throw new AuthError()
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `Delete failed (${res.status})`)
  }
}

export const weddingApi = {
  days: {
    list: (token: string): Promise<WeddingDay[]> =>
      fetchWithAuth('/api/wedding/days', { token }).then(handleResponse),
  },

  categories: {
    list: (dayId: number, token: string): Promise<DayCategoriesResponse> =>
      fetchWithAuth(`/api/wedding/days/${dayId}/categories`, { token }).then(handleResponse),

    create: (dayId: number, name: string, token: string): Promise<CategoryDto> =>
      fetchWithAuth(`/api/wedding/days/${dayId}/categories`, {
        method: 'POST',
        token,
        body: JSON.stringify({ name }),
      }).then(handleResponse),

    delete: (dayId: number, categoryId: number, token: string): Promise<void> =>
      fetchWithAuth(`/api/wedding/days/${dayId}/categories/${categoryId}`, {
        method: 'DELETE',
        token,
      }).then(handleDelete),
  },

  items: {
    listByDay: (dayId: number, token: string): Promise<WeddingItemDto[]> =>
      fetchWithAuth(`/api/wedding/days/${dayId}/items`, { token }).then(handleResponse),

    create: (request: CreateWeddingItemRequest, token: string): Promise<WeddingItemDto> =>
      fetchWithAuth('/api/wedding/items', {
        method: 'POST',
        token,
        body: JSON.stringify(request),
      }).then(handleResponse),

    update: (id: number, request: UpdateWeddingItemRequest, token: string): Promise<WeddingItemDto> =>
      fetchWithAuth(`/api/wedding/items/${id}`, {
        method: 'PUT',
        token,
        body: JSON.stringify(request),
      }).then(handleResponse),

    delete: (id: number, token: string): Promise<void> =>
      fetchWithAuth(`/api/wedding/items/${id}`, {
        method: 'DELETE',
        token,
      }).then(handleDelete),
  },

  payments: {
    add: (itemId: number, request: AddPaymentRequest, token: string): Promise<WeddingItemDto> =>
      fetchWithAuth(`/api/wedding/items/${itemId}/payments`, {
        method: 'POST',
        token,
        body: JSON.stringify(request),
      }).then(handleResponse),

    delete: (itemId: number, paymentId: number, token: string): Promise<WeddingItemDto> =>
      fetchWithAuth(`/api/wedding/items/${itemId}/payments/${paymentId}`, {
        method: 'DELETE',
        token,
      }).then(handleResponse),
  },

  images: {
    add: (itemId: number, imageBase64: string, token: string): Promise<WeddingItemDto> =>
      fetchWithAuth(`/api/wedding/items/${itemId}/images`, {
        method: 'POST',
        token,
        body: JSON.stringify({ imageBase64 }),
      }).then(handleResponse),

    delete: (itemId: number, imageIndex: number, token: string): Promise<WeddingItemDto> =>
      fetchWithAuth(`/api/wedding/items/${itemId}/images/${imageIndex}`, {
        method: 'DELETE',
        token,
      }).then(handleResponse),
  },
}
