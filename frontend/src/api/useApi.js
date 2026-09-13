import { useCallback, useEffect, useRef, useState } from 'react'

import { apiFetch } from './client.js'

// Small in-memory cache so back/forward navigation is instant and the header
// never re-fetches site settings. Keyed by path.
const cache = new Map()

/**
 * useApi('/pages/home/') → { data, error, loading, refetch }
 */
export function useApi(path, { enabled = true } = {}) {
  const cached = path ? cache.get(path) : undefined
  const [state, setState] = useState({
    data: cached ?? null,
    error: null,
    loading: enabled && !cached,
  })
  const version = useRef(0)

  const load = useCallback(
    async (signal, { silent = false } = {}) => {
      if (!path || !enabled) return
      const id = ++version.current
      if (!silent) setState((s) => ({ ...s, loading: !cache.has(path), error: null }))
      try {
        const { data } = await apiFetch(path, { signal })
        cache.set(path, data)
        if (id === version.current) setState({ data, error: null, loading: false })
      } catch (error) {
        if (error.name === 'AbortError') return
        if (id === version.current) setState((s) => ({ ...s, error, loading: false }))
      }
    },
    [path, enabled],
  )

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal, { silent: cache.has(path) })
    return () => controller.abort()
  }, [load, path])

  const refetch = useCallback(() => load(undefined), [load])

  return { ...state, refetch }
}
