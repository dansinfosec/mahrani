/**
 * MAHARANI crown emblem — a placeholder drawn to echo the reference
 * (five-point crown with pearls). Replace with the approved brand SVG later.
 */
export default function Crown({ className = '', title }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 44"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : 'true'}
    >
      {title ? <title>{title}</title> : null}
      <path d="M10 34 L6 12 L19 22 L32 6 L45 22 L58 12 L54 34 Z" />
      <path d="M10 39 H54" />
      <circle cx="32" cy="4" r="2" fill="currentColor" stroke="none" />
      <circle cx="6" cy="10" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="58" cy="10" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="19" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="45" cy="20" r="1.3" fill="currentColor" stroke="none" />
      <path d="M26 30 Q32 25 38 30" />
    </svg>
  )
}
