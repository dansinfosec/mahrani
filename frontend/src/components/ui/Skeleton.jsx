export function Skeleton({ width = '100%', height = '1rem', radius, style, className = '' }) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ display: 'block', width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

export function PageSkeleton() {
  return (
    <div className="container page-skeleton" role="status" aria-live="polite" aria-label="Loading">
      <Skeleton width="30%" height="0.75rem" />
      <Skeleton width="70%" height="clamp(3rem, 8vw, 7rem)" />
      <Skeleton width="55%" height="clamp(3rem, 8vw, 7rem)" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <Skeleton height="26rem" />
        <Skeleton height="26rem" />
      </div>
    </div>
  )
}
