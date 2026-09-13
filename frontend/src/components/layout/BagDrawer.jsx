import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { useCart } from '../../cart/CartContext.jsx'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.js'
import { formatPrice } from '../../lib/format.js'
import { EASE_OUT } from '../../lib/motion.js'
import { useSite } from '../../site/SiteContext.jsx'
import Button from '../ui/Button.jsx'
import Picture from '../ui/Picture.jsx'
import QuantityStepper from '../ui/QuantityStepper.jsx'

export default function BagDrawer() {
  const cart = useCart()
  return (
    <AnimatePresence>
      {cart.isOpen ? <Drawer key="bag" /> : null}
    </AnimatePresence>
  )
}

function Drawer() {
  const cart = useCart()
  const { site } = useSite()
  const ref = useRef(null)
  useLockBodyScroll(true)
  useFocusTrap(ref, true, cart.close)

  const { items, subtotal, currency } = cart.cart
  const featured = site.featured_product

  return (
    <>
      <motion.div
        className="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        onClick={cart.close}
        aria-hidden="true"
      />
      <motion.aside
        ref={ref}
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bag-title"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        <div className="drawer__head">
          <h2 id="bag-title" className="drawer__title">
            Your bag <span className="header__bag-count">({cart.cart.item_count})</span>
          </h2>
          <button type="button" className="drawer__close" onClick={cart.close} data-autofocus>
            Close
          </button>
        </div>

        <div className="drawer__body">
          {cart.lastAdded ? (
            <p className="bag-added" role="status">
              Added to your bag.
            </p>
          ) : null}
          {cart.error ? <p className="inline-error">{cart.error.message}</p> : null}

          {items.length === 0 ? (
            <div className="bag-empty">
              <p className="bag-empty__title">Your bag is empty.</p>
              <p className="muted">Beauty in every layer awaits.</p>
              {featured ? (
                <Button variant="secondary" href={featured.url} onClick={cart.close}>
                  Shop {featured.name}
                </Button>
              ) : null}
            </div>
          ) : (
            <ul>
              {items.map((item) => (
                <li className="bag-line" key={item.id}>
                  <Link to={item.product.url} className="bag-line__media" onClick={cart.close}>
                    <Picture image={item.product.primary_image} sizes="6rem" />
                  </Link>
                  <div className="bag-line__body">
                    <Link to={item.product.url} className="bag-line__name" onClick={cart.close}>
                      {item.product.name}
                    </Link>
                    {item.variant ? <span className="bag-line__meta">{item.variant.name}</span> : null}
                    <span className="bag-line__meta">{formatPrice(item.unit_price, currency)} each</span>
                    <div className="bag-line__row">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        max={Math.min(10, item.available_stock)}
                        onChange={(q) => cart.updateItem(item.id, q)}
                        disabled={cart.pending}
                      />
                      <span className="price" style={{ fontSize: '1.15rem' }}>
                        {formatPrice(item.line_total, currency)}
                      </span>
                    </div>
                    <button type="button" className="bag-line__remove" onClick={() => cart.removeItem(item.id)} disabled={cart.pending}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 ? (
          <div className="drawer__foot">
            <div className="bag-total">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal, currency)}</span>
            </div>
            <p className="bag-note">Shipping is calculated at checkout. Secure checkout arrives with the next release; your bag is saved on this device.</p>
            <Button variant="primary" size="lg" block disabled aria-disabled="true" title="Checkout is not yet available">
              Checkout — coming soon
            </Button>
            <Button variant="text" onClick={cart.close}>
              Continue shopping
            </Button>
          </div>
        ) : null}
      </motion.aside>
    </>
  )
}
