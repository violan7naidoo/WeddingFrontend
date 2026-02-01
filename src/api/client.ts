const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5052'

export function getApiBaseUrl() {
  return API_BASE_URL
}

export async function fetchWithAuth(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<Response> {
  const { token, ...rest } = options
  const headers = new Headers(rest.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('Content-Type', 'application/json')
  return fetch(`${API_BASE_URL}${path}`, { ...rest, headers })
}
