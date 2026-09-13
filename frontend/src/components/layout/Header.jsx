import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Link, NavLink } from 'react-router-dom'

import { useCart } from '../../cart/CartContext.jsx'
import { useScrolled } from '../../hooks/useScrolled.js'
import { classNames } from '../../lib/format.js'
import { useSite } from '../../site/SiteContext.jsx'
import Crown from '../brand/Crown.jsx'
import { SmartLink } from '../ui/Button.jsx'
import MobileMenu from './MobileMenu.jsx'
import SearchOverlay from './SearchOverlay.jsx'

export default function Header({ transparent = false }) {
  const { site } = useSite()
  const cart = useCart()
  const scrolled = useScrolled(32)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const solid = !transparent || scrolled || menuOpen

  return (
    <>
      {site.announcement.enabled ? <div className="announcement">{site.announcement.text}</div> : null}
      <header className={classNames('header', solid && 'header--solid', site.announcement.enabled && 'header--static')}>
        <div className="container header__inner">
          <Link to="/" className="header__brand" aria-label={`${site.brand_name} home`}>
            <Crown className="header__crown" />
            <span className="wordmark header__wordmark">{site.brand_name}</span>
          </Link>

          <nav className="header__nav" aria-label="Primary">
            {site.navigation.map((link) => (
              <NavItem key={link.label + link.href} link={link} />
            ))}
          </nav>

          <div className="header__utils">
            <button
              type="button"
              className="header__util header__util--hidden-mobile"
              onClick={() => setSearchOpen(true)}
              aria-expanded={searchOpen}
            >
              Search
            </button>
            <Link to="/account" className="header__util header__util--hidden-mobile">
              Account
            </Link>
            <button type="button" className="header__util" onClick={cart.open} aria-haspopup="dialog" aria-expanded={cart.isOpen}>
              Bag <span className="header__bag-count">({cart.cart.item_count})</span>
            </button>
          <button
            type="button"
            className="header__menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <span className="header__menu-lines" aria-hidden="true">
              <span />
              <span />
            </span>
            Menu
          </button>

          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen ? (
          <MobileMenu
            key="menu"
            id="mobile-menu"
            onClose={() => setMenuOpen(false)}
            onSearch={() => {
              setMenuOpen(false)
              setSearchOpen(true)
            }}
          />
        ) : null}
        {searchOpen ? <SearchOverlay key="search" onClose={() => setSearchOpen(false)} /> : null}
      </AnimatePresence>
    </>
  )
}

function NavItem({ link }) {
  const isPath = link.href.startsWith('/') && !link.href.includes('#')
  if (isPath) {
    return (
      <NavLink to={link.href} className="header__link" end={link.href === '/'}>
        {link.label}
      </NavLink>
    )
  }
  return (
    <SmartLink href={link.href} className="header__link">
      {link.label}
    </SmartLink>
  )
}
