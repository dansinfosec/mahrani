import { padNumber } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import MediaReveal from '../ui/MediaReveal.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

/**
 * Specifications as editorial callouts around the product — on desktop odd
 * rows sit to the left of the object and even rows to the right, with leader
 * lines pointing at it; on mobile they read as one numbered ledger. The
 * dimensions follow as large figures along a hairline. Everything comes
 * from the catalog Product.
 */
export default function ProductDetails({ anchor_id, eyebrow, heading, intro, product, extra_items = [], image }) {
  if (!product) return null
  const rows = [...(product.specifications || []), ...extra_items]
  const media = image || product.primary_image

  return (
    <section className="section details bleed" id={anchor_id || undefined}>
      <div className="details__head">
        <Reveal>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
        <Heading as="h2" text={heading} className="h2" />
        {intro ? (
          <Reveal delay={0.15}>
            <p className="muted measure">{intro}</p>
          </Reveal>
        ) : null}
      </div>

      {media ? (
        <MediaReveal className="details__media">
          <Picture image={media} sizes="(min-width: 1024px) 30vw, 70vw" />
        </MediaReveal>
      ) : null}

      {rows.length ? (
        <ol className="callouts" aria-label="Specifications">
          {rows.map((row, index) => (
            <Reveal as="li" key={`${row.label}-${index}`} className="callout" delay={index * 0.05}>
              <span className="callout__num" aria-hidden="true">
                {padNumber(index + 1)}
              </span>
              <span className="callout__label caps">{row.label}</span>
              <span className="callout__value">{row.value}</span>
            </Reveal>
          ))}
        </ol>
      ) : null}

      <div className="details__foot">
        {product.dimensions ? <Dimensions dimensions={product.dimensions} /> : null}
        {product.materials ? (
          <Reveal delay={0.1}>
            <p className="details__materials caption">
              <span className="caps">Materials</span> {product.materials}
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}

function Dimensions({ dimensions }) {
  const entries = [
    ['Height', dimensions.height],
    ['Width', dimensions.width],
    ['Depth', dimensions.depth],
  ].filter(([, value]) => value)
  if (!entries.length) return null
  return (
    <Reveal as="dl" className="dims">
      {entries.map(([label, value]) => (
        <div className="dims__item" key={label}>
          <dt className="caps dims__label">{label}</dt>
          <dd className="dims__figure">
            <span className="dims__value">
              {value.cm}
              <span className="dims__unit">cm</span>
            </span>
            <span className="dims__alt">{value.in} in</span>
          </dd>
        </div>
      ))}
      {dimensions.note ? <p className="dims__note">{dimensions.note}</p> : null}
    </Reveal>
  )
}
