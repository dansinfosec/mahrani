import { classNames } from '../../lib/format.js'

/**
 * Line icons keyed by the backend FeatureIcon choices. Drawn thin and warm to
 * sit with the rose-gold hardware rather than as UI glyphs.
 */
const PATHS = {
  mirror: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <circle cx="7.5" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="7" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="7.5" cy="17" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16.5" cy="17" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11 18.5h2" />
    </>
  ),
  touch: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5" />
      <path d="M8.8 9.2a4.5 4.5 0 1 0 6.4 0" />
    </>
  ),
  drawers: (
    <>
      <rect x="4" y="4" width="16" height="5" rx="0.8" />
      <rect x="4" y="9.5" width="16" height="5" rx="0.8" />
      <rect x="4" y="15" width="16" height="5" rx="0.8" />
      <path d="M11 6.5h2M11 12h2M11 17.5h2" />
    </>
  ),
  leather: (
    <>
      <path d="M5 8c2-3 5-4 7-4s5 1 7 4c1.5 2.5 1.5 6 0 8.5C17 19.5 14 20 12 20s-5-.5-7-3.5C3.5 14 3.5 10.5 5 8Z" />
      <path d="M8 8.5c1.5 1 2.5 3 2.5 5M16 8.5c-1.5 1-2.5 3-2.5 5" />
    </>
  ),
  travel: (
    <>
      <rect x="4" y="7" width="16" height="13" rx="2" />
      <path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2" />
      <path d="M8 7v13M16 7v13" />
    </>
  ),
  size: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="1.5" />
      <path d="M3 5v14M21 5v14M3 12h2M19 12h2" />
    </>
  ),
  crown: (
    <>
      <path d="M4 17 3 8l5 3.5L12 5l4 6.5L21 8l-1 9Z" />
      <path d="M4 20h16" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3v18M3 12h18" />
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 12H6Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8.5" r="4" />
      <path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
  minus: <path d="M6 12h12" />,
  plus: <path d="M12 6v12M6 12h12" />,
  star: <path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 17l-5.4 3 1.2-6L3.3 9.8l6.1-.7Z" fill="currentColor" stroke="none" />,
}

export default function Icon({ name, className, size, title }) {
  const path = PATHS[name] || PATHS.sparkle
  return (
    <svg
      className={classNames('icon', size === 'lg' && 'icon--lg', className)}
      viewBox="0 0 24 24"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : 'presentation'}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {path}
    </svg>
  )
}
