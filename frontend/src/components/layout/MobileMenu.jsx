import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

import { useCart } from '../../cart/CartContext.jsx'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll.js'
import { EASE_OUT } from '../../lib/motion.js'
import { useSite } from '../../site/SiteContext.jsx'
import Crown from '../brand/Crown.jsx'
import { SmartLink } from '../ui/Button.jsx'

export default function MobileMenu({ id, onClose, onSearch }) {
  const { site } = useSite()
  const cart = useCart()
  const ref = useRef(null)
  useLockBodyScroll(true)
  useFocusTrap(ref, true, onClose)

  return (
    <motion.div
      ref={ref}
      id={id}
      className="menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
    >
      <div className="menu__head">
        <Link to="/" className="header__brand" onClick={onClose} aria-label={`${site.brand_name} home`}>
          <Crown className="header__crown" />
          <span className="wordmark header__wordmark">{site.brand_name}</span>
        </Link>
        <button type="button" className="drawer__close" onClick={onClose} data-autofocus>
          Close
        </button>
      </div>

      <nav className="menu__list" aria-label="Primary">
        {site.navigation.map((link, index) => (
          <motion.div
            key={link.label + link.href}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.1 + index * 0.07 }}
          >
            <SmartLink href={link.href} className="menu__link" onClick={onClose}>
              {link.label}
            </SmartLink>
          </motion.div>
        ))}
      </nav>

      <div className="menu__utils">
        <button type="button" className="header__util" onClick={onSearch}>
          Search
        </button>
        <Link to="/account" className="header__util" onClick={onClose}>
          Account
        </Link>
        <button
          type="button"
          className="header__util"
          onClick={() => {
            onClose()
            cart.open()
          }}
        >
          Bag <span className="header__bag-count">({cart.cart.item_count})</span>
        </button>
      </div>
      <p className="menu__tagline">{site.tagline}</p>
    </motion.div>
  )
}
