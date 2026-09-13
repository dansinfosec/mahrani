import Button from './Button.jsx'

export default function ErrorState({
  title = 'Something went quiet.',
  message = 'We could not load this content right now.',
  onRetry,
  actionHref = '/',
  actionLabel = 'Back to home',
}) {
  return (
    <section className="state" role="alert">
      <h1 className="state__title">{title}</h1>
      <p className="state__text">{message}</p>
      <div className="state__actions">
        {onRetry ? (
          <Button variant="primary" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        <Button variant="secondary" href={actionHref}>
          {actionLabel}
        </Button>
      </div>
    </section>
  )
}
