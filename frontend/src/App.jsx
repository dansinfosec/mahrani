import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'

import Layout from './components/layout/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import { PageSkeleton } from './components/ui/Skeleton.jsx'

const ProductPage = lazy(() => import('./pages/ProductPage.jsx'))
const StandardPage = lazy(() => import('./pages/StandardPage.jsx'))
const AccountPage = lazy(() => import('./pages/AccountPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route
          path="products/:slug"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <ProductPage />
            </Suspense>
          }
        />
        <Route
          path="account"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <AccountPage />
            </Suspense>
          }
        />
        <Route
          path=":slug"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <StandardPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageSkeleton />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
