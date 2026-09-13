/**
 * Thin fetch wrapper for the Django API.
 *
 * In development the Vite proxy forwards /api and /media to Django, so the
 * base URL is empty. In production set VITE_API_BASE_URL to the Railway host.
 */

// Normalised so any of "https://host", "https://host/", "https://host/api/v1" work.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')
  .replace(/\/api\/v1$/, '')

if (import.meta.env.DEV && API_BASE_URL && !/^https?:\/\//.test(API_BASE_URL)) {
  console.warn('[api] VITE_API_BASE_URL should include the scheme, e.g. https://api.example.com')
}
const API_PREFIX = '/api/v1'

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function messageFromData(data, fallback) {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  const firstKey = Object.keys(data)[0]
  const value = data[firstKey]
  if (Array.isArray(value)) return value[0]
  if (typeof value === 'string') return value
  return fallback
}

export async function apiFetch(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const url = `${API_BASE_URL}${API_PREFIX}${path}`
  const init = {
    method,
    headers: { Accept: 'application/json', ...headers },
    signal,
  }
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(url, init)
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('We could not reach the store. Please check your connection.', { status: 0 })
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    const fallback =
      response.status === 404
        ? 'Not found.'
        : response.status >= 500
          ? 'The store is temporarily unavailable.'
          : 'Something went wrong.'
    throw new ApiError(messageFromData(data, fallback), { status: response.status, data })
  }
  return { data, headers: response.headers }
}

export const endpoints = {
  site: '/site/',
  homePage: '/pages/home/',
  page: (slug) => `/pages/${encodeURIComponent(slug)}/`,
  products: (params = '') => `/products/${params}`,
  product: (slug) => `/products/${encodeURIComponent(slug)}/`,
  shippingMethods: '/shipping/methods/',
  cart: '/cart/',
  cartItems: '/cart/items/',
  cartItem: (id) => `/cart/items/${id}/`,
}
