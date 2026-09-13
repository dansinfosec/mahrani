/* eslint-disable react-refresh/only-export-components -- provider + hook live together */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'

import { apiFetch, endpoints } from '../api/client.js'

const TOKEN_KEY = 'maharani.cart.token'

const CartContext = createContext(null)

const emptyCart = { token: null, currency: 'USD', items: [], item_count: 0, subtotal: '0.00' }

function readToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable (private mode) — cart still works for the session */
  }
}

const initialState = {
  cart: emptyCart,
  status: 'idle', // idle | loading | ready | error
  error: null,
  pending: false, // a mutation is in flight
  isOpen: false,
  lastAdded: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'load':
      return { ...state, status: 'loading', error: null }
    case 'ready':
      return { ...state, status: 'ready', cart: action.cart, error: null, pending: false }
    case 'error':
      return { ...state, status: state.status === 'loading' ? 'error' : state.status, error: action.error, pending: false }
    case 'pending':
      return { ...state, pending: true, error: null }
    case 'added':
      return { ...state, cart: action.cart, pending: false, isOpen: true, lastAdded: action.item }
    case 'open':
      return { ...state, isOpen: true }
    case 'close':
      return { ...state, isOpen: false, lastAdded: null }
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const tokenRef = useRef(readToken())

  const request = useCallback(async (path, options = {}) => {
    const headers = { ...(options.headers || {}) }
    if (tokenRef.current) headers['X-Cart-Token'] = tokenRef.current
    const { data, headers: responseHeaders } = await apiFetch(path, { ...options, headers })
    const token = responseHeaders.get('X-Cart-Token') || data?.token
    if (token && token !== tokenRef.current) {
      tokenRef.current = token
      writeToken(token)
    }
    return data
  }, [])

  // Hydrate an existing cart on first load.
  useEffect(() => {
    if (!tokenRef.current) {
      dispatch({ type: 'ready', cart: emptyCart })
      return
    }
    let cancelled = false
    dispatch({ type: 'load' })
    request(endpoints.cart)
      .then((cart) => {
        if (cancelled) return
        if (!cart.token) {
          tokenRef.current = null
          writeToken(null)
        }
        dispatch({ type: 'ready', cart })
      })
      .catch((error) => !cancelled && dispatch({ type: 'error', error }))
    return () => {
      cancelled = true
    }
  }, [request])

  const addItem = useCallback(
    async ({ slug, quantity = 1, variantId = null }) => {
      dispatch({ type: 'pending' })
      try {
        const cart = await request(endpoints.cartItems, {
          method: 'POST',
          body: { product: slug, quantity, variant_id: variantId },
        })
        const item = cart.items.find((i) => i.product.slug === slug && (i.variant?.id ?? null) === variantId)
        dispatch({ type: 'added', cart, item })
        return { ok: true, cart }
      } catch (error) {
        dispatch({ type: 'error', error })
        return { ok: false, error }
      }
    },
    [request],
  )

  const updateItem = useCallback(
    async (id, quantity) => {
      dispatch({ type: 'pending' })
      try {
        const cart = await request(endpoints.cartItem(id), { method: 'PATCH', body: { quantity } })
        dispatch({ type: 'ready', cart })
        return { ok: true }
      } catch (error) {
        dispatch({ type: 'error', error })
        return { ok: false, error }
      }
    },
    [request],
  )

  const removeItem = useCallback(
    async (id) => {
      dispatch({ type: 'pending' })
      try {
        const cart = await request(endpoints.cartItem(id), { method: 'DELETE' })
        dispatch({ type: 'ready', cart })
      } catch (error) {
        dispatch({ type: 'error', error })
      }
    },
    [request],
  )

  const value = useMemo(
    () => ({
      ...state,
      addItem,
      updateItem,
      removeItem,
      open: () => dispatch({ type: 'open' }),
      close: () => dispatch({ type: 'close' }),
    }),
    [state, addItem, updateItem, removeItem],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}
