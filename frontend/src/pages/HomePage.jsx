import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import { endpoints } from '../api/client.js'
import { useApi } from '../api/useApi.js'
import BlockRenderer from '../components/blocks/BlockRenderer.jsx'
import Seo from '../components/seo/Seo.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { productJsonLd } from '../lib/jsonld.js'
import { useSite } from '../site/SiteContext.jsx'

export default function HomePage() {
  const { data: page, error, loading, refetch } = useApi(endpoints.homePage)
  const { site } = useSite()
  const { hash } = useLocation()

  // Once content is on the page, honour /#shop style deep links.
  useEffect(() => {
    if (!page || !hash) return
    const target = document.getElementById(hash.slice(1))
    if (target) window.requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }))
  }, [page, hash])

  if (loading) return <PageSkeleton />
  if (error) {
    return (
      <ErrorState
        title={error.status === 404 ? 'The house is not open yet.' : 'The store is resting.'}
        message={error.status === 404 ? 'Publish the home page in Wagtail to bring it to life.' : error.message}
        onRetry={refetch}
        actionHref="/account"
        actionLabel="Account"
      />
    )
  }
  if (!page?.body?.length) {
    return (
      <ErrorState
        title="Nothing here yet."
        message="Add sections to the home page in Wagtail; they will appear here in the order you set."
        onRetry={refetch}
      />
    )
  }

  const purchase = page.body.find((block) => block.type === 'product_purchase')?.value?.product
  const jsonLd = purchase
    ? productJsonLd(purchase, { brand: site.brand_name, url: `${page.seo.canonical.replace(/\/$/, '')}${purchase.url}` })
    : null

  return (
    <>
      <Seo seo={page.seo} jsonLd={jsonLd} />
      <BlockRenderer blocks={page.body} />
    </>
  )
}
