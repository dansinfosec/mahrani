import { useParams } from 'react-router-dom'

import { endpoints } from '../api/client.js'
import { useApi } from '../api/useApi.js'
import BlockRenderer from '../components/blocks/BlockRenderer.jsx'
import Seo from '../components/seo/Seo.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'

export default function StandardPage() {
  const { slug } = useParams()
  const { data: page, error, loading, refetch } = useApi(endpoints.page(slug))

  if (loading) return <PageSkeleton />
  if (error) {
    if (error.status === 404) return <ErrorState title="Page not found." message="This page does not exist or has not been published." />
    return <ErrorState message={error.message} onRetry={refetch} />
  }
  if (!page) return null

  const hasHero = page.body?.[0]?.type === 'hero'

  return (
    <>
      <Seo seo={page.seo} />
      {!hasHero ? (
        <header className="section" style={{ paddingTop: 'calc(var(--header-h) + var(--section-y) * 0.6)', paddingBottom: 0 }}>
          <div className="container">
            <p className="eyebrow">{page.title}</p>
            {page.intro ? (
              <p className="display" style={{ marginTop: '1.5rem', maxWidth: '18ch' }}>
                {page.intro}
              </p>
            ) : null}
          </div>
        </header>
      ) : null}
      <BlockRenderer blocks={page.body} />
    </>
  )
}
