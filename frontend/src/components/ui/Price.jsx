import { classNames, formatPrice } from '../../lib/format.js'

export default function Price({ amount, compareAt, currency = 'USD', className, showBadge = true }) {
  const onSale = compareAt && Number(compareAt) > Number(amount)
  return (
    <span className={classNames('price', className)}>
      <span className="price__current">{formatPrice(amount, currency)}</span>
      {onSale ? (
        <>
          <s className="price__compare">
            <span className="sr-only">Was </span>
            {formatPrice(compareAt, currency)}
          </s>
          {showBadge ? <span className="price__badge">Launch price</span> : null}
        </>
      ) : null}
    </span>
  )
}
