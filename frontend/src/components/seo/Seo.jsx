import { useSite } from '../../site/SiteContext.jsx'

const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '')

/**
 * Document head for a page. React 19 hoists <title>/<meta>/<link> rendered
 * anywhere in the tree into <head>, so no head-manager library is needed.
 *
 * `seo` is the object returned by the API (`page.seo`), or a minimal
 * {title, description, canonical, og:{image}} built by the page component.
 */
export default function Seo({ seo, jsonLd }) {
  const { site } = useSite()
  if (!seo) return null

  const title = seo.full_title || seo.title || site.brand_name
  const description = seo.description || site.seo.default_description || ''
  const canonical = seo.canonical || (SITE_URL ? `${SITE_URL}${window.location.pathname}` : undefined)
  const ogImage = seo.og?.image || site.seo.default_og_image
  const robots = seo.no_index ? 'noindex, nofollow' : 'index, follow'

  return (
    <>
      <title>{title}</title>
      {description ? <meta name="description" content={description} /> : null}
      <meta name="robots" content={robots} />
      {canonical ? <link rel="canonical" href={canonical} /> : null}
      <meta property="og:site_name" content={site.brand_name} />
      <meta property="og:type" content={seo.og?.type || 'website'} />
      <meta property="og:title" content={seo.og?.title || title} />
      {description ? <meta property="og:description" content={seo.og?.description || description} /> : null}
      {canonical ? <meta property="og:url" content={canonical} /> : null}
      {ogImage ? <meta property="og:image" content={ogImage.sizes?.large || ogImage.src} /> : null}
      {ogImage?.alt ? <meta property="og:image:alt" content={ogImage.alt} /> : null}
      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}
    </>
  )
}
