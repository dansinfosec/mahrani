import { useEffect, useMemo, useState } from 'react'

import { endpoints } from '../../api/client.js'
import { useApi } from '../../api/useApi.js'
import { useCart } from '../../cart/CartContext.jsx'
import { classNames, formatPrice } from '../../lib/format.js'
import Button from '../ui/Button.jsx'
import Price from '../ui/Price.jsx'
import QuantityStepper from '../ui/QuantityStepper.jsx'
import RichText from '../ui/RichText.jsx'

/**
 * The purchase UI shared by the home page purchase section and the product
 * page. All data comes from the API product object; the cart is server-side.
 */
export default function PurchasePanel({ product, headingLevel = 2, showShipping = true, note, compact = false }) {
  const cart = useCart()
  const [quantity, setQuantity] = useState(1)
  const [variantId, setVariantId] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const variants = useMemo(() => product.variants || [], [product.variants])
  const activeVariant = variants.find((v) => v.id === variantId) || null

  useEffect(() => {
    if (variants.length && variantId === null) {
      const first = variants.find((v) => v.in_stock) || variants[0]
      setVariantId(first.id)
    }
  }, [variants, variantId])

  const availability = activeVariant
    ? activeVariant.in_stock
      ? { status: 'in_stock', label: 'In stock', quantity: activeVariant.stock_quantity }
      : { status: 'sold_out', label: 'Sold out', quantity: 0 }
    : product.availability

  const canBuy = availability.status === 'in_stock' || availability.status === 'low_stock'
  const maxQuantity = Math.max(1, Math.min(10, availability.quantity || 0))
  const price = activeVariant ? activeVariant.price : product.price

  const HeadingTag = `h${headingLevel}`

  const handleAdd = async () => {
    setFeedback(null)
    const result = await cart.addItem({ slug: product.slug, quantity, variantId })
    if (result.ok) {
      setFeedback({ type: 'ok', text: `${product.name} added to your bag.` })
    } else {
      setFeedback({ type: 'error', text: result.error?.message || 'Could not add to bag.' })
    }
  }

  return (
    <div className={classNames('panel', compact && 'panel--compact')}>
      {product.collaboration_label ? <p className="caps panel__edition">{product.collaboration_label}</p> : null}
      <HeadingTag className="h2 panel__name">{product.name}</HeadingTag>

      <Price amount={price} compareAt={activeVariant ? null : product.compare_at_price} currency={product.currency} className="panel__price" />

      <div className="panel__meta">
        <span className={classNames('availability', `availability--${availability.status}`)}>{availability.label}</span>
        {product.sku ? <span className="panel__sku">SKU {activeVariant?.sku || product.sku}</span> : null}
      </div>

      <p className="panel__summary">{product.short_description}</p>

      {variants.length ? (
        <div className="panel__variants">
          <span className="caps muted">Edition</span>
          <div className="panel__variant-list" role="group" aria-label="Choose an edition">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className="panel__variant"
                aria-pressed={variant.id === variantId}
                onClick={() => setVariantId(variant.id)}
                disabled={!variant.in_stock}
              >
                {variant.name}
                {!variant.in_stock ? ' — sold out' : ''}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="panel__buy">
        <QuantityStepper value={quantity} onChange={setQuantity} max={maxQuantity} disabled={!canBuy || cart.pending} />
        <Button variant="primary" size="lg" block onClick={handleAdd} disabled={!canBuy || cart.pending} aria-busy={cart.pending}>
          {cart.pending ? 'Adding…' : canBuy ? `Add to bag — ${formatPrice(Number(price) * quantity, product.currency)}` : 'Sold out'}
        </Button>
      </div>

      <p className={classNames('panel__feedback', feedback?.type === 'error' && 'panel__feedback--error')} role="status" aria-live="polite">
        {feedback?.text || ''}
      </p>

      {note ? <p className="panel__note">{note}</p> : null}

      {showShipping ? <ShippingInfo product={product} /> : null}
    </div>
  )
}

function ShippingInfo({ product }) {
  const { data: methods, error } = useApi(endpoints.shippingMethods)
  if (!product.shipping_information && !methods?.length) return null
  return (
    <div className="panel__shipping">
      <span className="caps muted">Shipping</span>
      <RichText html={product.shipping_information} />
      {methods?.length ? (
        <ul className="ship-methods">
          {methods.map((method) => (
            <li className="ship-method" key={method.id}>
              <span>
                <span className="ship-method__name">{method.name}</span>
                <span className="ship-method__eta">
                  {method.estimated_min_days}–{method.estimated_max_days} business days
                  {method.description ? ` · ${method.description}` : ''}
                </span>
              </span>
              <span className="ship-method__price">{method.is_free ? 'Complimentary' : formatPrice(method.price, method.currency)}</span>
            </li>
          ))}
        </ul>
      ) : error ? (
        <p className="panel__note">Shipping options are shown at checkout.</p>
      ) : null}
    </div>
  )
}
