import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { endpoints } from '../api/client.js'
import { useApi } from '../api/useApi.js'
import PurchasePanel from '../components/product/PurchasePanel.jsx'
import Seo from '../components/seo/Seo.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import Icon from '../components/ui/Icon.jsx'
import Picture from '../components/ui/Picture.jsx'
import Reveal from '../components/ui/Reveal.jsx'
import RichText from '../components/ui/RichText.jsx'
import { PageSkeleton } from '../components/ui/Skeleton.jsx'
import { padNumber } from '../lib/format.js'
import { productJsonLd } from '../lib/jsonld.js'
import { useSite } from '../site/SiteContext.jsx'

const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '')

export default function ProductPage() {
  const { slug } = useParams()
  const { data: product, error, loading, refetch } = useApi(endpoints.product(slug))
  const { site } = useSite()
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => setActiveImage(0), [slug])

  if (loading) return <PageSkeleton />
  if (error) {
    if (error.status === 404) {
      return <ErrorState title="This piece is not in the collection." message="The product you are looking for does not exist or is no longer available." />
    }
    return <ErrorState message={error.message} onRetry={refetch} />
  }
  if (!product) return null

  const images = [product.primary_image, ...(product.gallery || []).map((g) => g.image)].filter(
    (image, index, all) => image && all.findIndex((other) => other?.id === image.id) === index,
  )
  const current = images[activeImage] || images[0]
  const url = `${SITE_URL}${product.url}`
  const seo = {
    title: product.name,
    full_title: `${product.name}${site.seo.title_suffix}`,
    description: product.short_description,
    canonical: SITE_URL ? url : undefined,
    og: { type: 'product', image: product.primary_image },
  }

  return (
    <article className="product">
      <Seo seo={seo} jsonLd={productJsonLd(product, { brand: site.brand_name, url })} />
      <div className="container">
        <nav className="product__crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product__top">
          <div className="product__gallery">
            <figure className="product__main-image">
              {current ? <Picture key={current.id} image={current} priority sizes="(min-width: 1024px) 50vw, 100vw" /> : null}
            </figure>
            {images.length > 1 ? (
              <div className="product__thumbs" role="group" aria-label="Product images">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    className="product__thumb"
                    aria-pressed={index === activeImage}
                    aria-label={`Show image ${index + 1}: ${image.alt}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <Picture image={image} sizes="5rem" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="product__panel">
            <PurchasePanel product={product} headingLevel={1} />
          </div>
        </div>

        {product.features?.length ? (
          <section className="product__section" aria-labelledby="product-features">
            <div className="product__section-head">
              <h2 id="product-features" className="h3">
                Designed around the ritual
              </h2>
            </div>
            <ul className="product__features">
              {product.features.map((feature, index) => (
                <Reveal as="li" key={feature.id} className="feature" delay={index * 0.06}>
                  <Icon name={feature.icon} size="lg" className="feature__icon" />
                  <h3 className="feature__title">{feature.title}</h3>
                  {feature.description ? <p className="feature__text">{feature.description}</p> : null}
                </Reveal>
              ))}
            </ul>
          </section>
        ) : null}

        {product.description ? (
          <section className="product__section" aria-labelledby="product-description">
            <div className="product__section-head">
              <h2 id="product-description" className="h3">
                The piece
              </h2>
            </div>
            <RichText html={product.description} />
          </section>
        ) : null}

        {product.layers?.length ? (
          <section className="product__section" aria-labelledby="product-layers">
            <div className="product__section-head">
              <h2 id="product-layers" className="h3">
                What each layer holds
              </h2>
            </div>
            <ol className="product__layers">
              {product.layers.map((layer) => (
                <li className="product__layer" key={layer.id}>
                  {layer.image ? (
                    <div className="product__layer-media">
                      <Picture image={layer.image} sizes="(min-width: 1024px) 20vw, 5rem" />
                    </div>
                  ) : null}
                  <div className="product__layer-body">
                    <span className="caps muted">Layer {padNumber(layer.number)}</span>
                    <h3 className="product__layer-name">{layer.name}</h3>
                    {layer.items?.length ? <p className="product__layer-items">{layer.items.join(' · ')}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {product.specifications?.length || product.dimensions ? (
          <section className="product__section" aria-labelledby="product-specs">
            <div className="product__section-head">
              <h2 id="product-specs" className="h3">
                Specifications
              </h2>
              {product.materials ? <p className="muted">{product.materials}</p> : null}
            </div>
            <ol className="ledger">
              {product.dimensions ? (
                <li className="ledger__row">
                  <span className="ledger__num">{padNumber(0)}</span>
                  <span className="ledger__cell">
                    <span className="caps ledger__label">Dimensions</span>
                    <span className="ledger__value">
                      {[product.dimensions.height, product.dimensions.width, product.dimensions.depth]
                        .filter(Boolean)
                        .map((d) => d.cm)
                        .join(' × ')}{' '}
                      cm
                    </span>
                  </span>
                </li>
              ) : null}
              {product.specifications.map((spec, index) => (
                <li className="ledger__row" key={spec.id}>
                  <span className="ledger__num">{padNumber(index + 1)}</span>
                  <span className="ledger__cell">
                    <span className="caps ledger__label">{spec.label}</span>
                    <span className="ledger__value">{spec.value}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>
    </article>
  )
}
