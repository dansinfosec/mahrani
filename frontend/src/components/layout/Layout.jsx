import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import BagDrawer from './BagDrawer.jsx'
import Footer from './Footer.jsx'
import Header from './Header.jsx'

export default function Layout() {
  const { pathname, hash } = useLocation()

  // Scroll to top on navigation unless a hash anchor is targeted (pages scroll
  // to hashes themselves once their content has loaded).
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header transparent={pathname === '/'} />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <BagDrawer />
    </>
  )
}
