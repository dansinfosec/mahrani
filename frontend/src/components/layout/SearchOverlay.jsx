import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { apiFetch, endpoints } from '../../api/client.js'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.js'
import { formatPrice } from '../../lib/format.js'
import { EASE_OUT } from '../../lib/motion.js'
import Picture from '../ui/Picture.jsx'

export default function SearchOverlay({ onClose }) {
  const ref = useRef(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  useLockBodyScroll(true)
  useFocusTrap(ref, true, onClose)

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults(null)
      return undefined
    }
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await apiFetch(endpoints.products(`?q=${encodeURIComponent(term)}`), { signal: controller.signal })
        setResults(data.results || [])
      } catch (err) {
        if (err.name !== 'AbortError') setError(err)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return (
    <>
      <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden="true" />
      <motion.div
        ref={ref}
        className="search"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        exit={{ y: '-100%' }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
      >
        <div className="container">
          <form className="search__form" role="search" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="site-search" className="sr-only">
              Search products
            </label>
            <input
              id="site-search"
              className="search__input"
              type="search"
              placeholder="Search the collection"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-autofocus
            />
            <button type="button" className="drawer__close" onClick={onClose}>
              Close
            </button>
          </form>

          <div aria-live="polite">
            {loading ? <p className="search__hint">Searching…</p> : null}
            {error ? <p className="inline-error">{error.message}</p> : null}
            {results && results.length === 0 && !loading ? <p className="search__hint">Nothing matches “{query}”.</p> : null}
            {results?.length ? (
              <ul className="search__results">
                {results.map((product) => (
                  <li key={product.id}>
                    <Link to={product.url} className="search__result" onClick={onClose}>
                      <Picture image={product.primary_image} sizes="4rem" />
                      <span className="search__result-name">{product.name}</span>
                      <span className="muted">{formatPrice(product.price, product.currency)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {!results && !loading ? <p className="search__hint">Type at least two letters to search.</p> : null}
          </div>
        </div>
      </motion.div>
    </>
  )
}
