import { useState } from 'react'

import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import MediaReveal from '../ui/MediaReveal.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

/**
 * Compact form. One tight composition: the wide "three centimetres"
 * photograph, the headline, and the real measurements as three large figures
 * (thickness first, because that is the point). Specifications follow as a
 * single hairline strip. Everything comes from the catalog Product.
 */
export default function ProductDetails({ anchor_id, chapter, eyebrow, heading, intro, product, extra_items = [], image }) {
  const [mediaBroken, setMediaBroken] = useState(false)
  if (!product) return null
  const media = mediaBroken ? null : image || product.primary_image
  const dims = product.dimensions
  // The measurement figures already state the dimensions; drop that spec row here.
  const rows = [...(product.specifications || []), ...extra_items].filter(
    (row) => !(dims && /^dimensions$/i.test(String(row.label || '').trim())),
  )
  const figures = dims
    ? [
        ['Thickness', dims.depth],
        ['Height', dims.height],
        ['Width', dims.width],
      ].filter(([, value]) => value)
    : []

  return (
    <section className="section section--tight compact bleed" id={anchor_id || undefined}>
      {media ? (
        <MediaReveal className="compact__media">
          <Picture image={media} sizes="(min-width: 1024px) 50vw, 100vw" onError={() => setMediaBroken(true)} />
        </MediaReveal>
      ) : null}

      <div className="compact__copy">
        <Reveal>
          <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
        </Reveal>
        <Heading as="h2" text={heading} className="h2" />
        {intro ? (
          <Reveal delay={0.15}>
            <p className="compact__intro caption">{intro}</p>
          </Reveal>
        ) : null}
        {dims?.note ? (
          <Reveal delay={0.2}>
            <p className="compact__note">{dims.note}</p>
          </Reveal>
        ) : null}
      </div>

      {figures.length ? (
        <Reveal as="dl" className="compact__figures" delay={0.2}>
          {figures.map(([label, value]) => (
            <div className="compact__figure" key={label}>
              <dd className="compact__value">
                {value.cm}
                <span className="compact__unit">cm</span>
              </dd>
              <dt className="compact__label caps">
                {label}
                <span className="compact__alt">{value.in} in</span>
              </dt>
            </div>
          ))}
        </Reveal>
      ) : null}

      {rows.length || product.materials ? (
        <Reveal as="div" variant="fade" className="compact__specs" delay={0.25}>
          <ul className="compact__spec-list" aria-label="Specifications">
            {rows.map((row, index) => (
              <li key={`${row.label}-${index}`} className="compact__spec">
                <span className="caps">{row.label}</span>
                <span>{row.value}</span>
              </li>
            ))}
          </ul>
          {product.materials ? <p className="compact__materials caption">{product.materials}</p> : null}
        </Reveal>
      ) : null}
    </section>
  )
}
