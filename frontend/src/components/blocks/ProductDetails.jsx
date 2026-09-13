import { padNumber } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

/**
 * Specifications as a numbered ledger rather than a table; dimensions as
 * large figures. All values come from the catalog Product.
 */
export default function ProductDetails({ anchor_id, eyebrow, heading, intro, product, extra_items = [], image }) {
  if (!product) return null
  const rows = [...(product.specifications || []), ...extra_items]
  const media = image || product.primary_image

  return (
    <section className="section" id={anchor_id || undefined}>
      <div className="container details__inner">
        <div className="details__side">
          <div className="details__head">
            <Reveal>
              <Eyebrow>{eyebrow}</Eyebrow>
            </Reveal>
            <Heading as="h2" text={heading} className="display" />
            {intro ? (
              <Reveal delay={0.15}>
                <p className="muted">{intro}</p>
              </Reveal>
            ) : null}
          </div>
          {media ? (
            <Reveal variant="fade" className="details__media">
              <Picture image={media} sizes="(min-width: 1024px) 24rem, 22rem" />
            </Reveal>
          ) : null}
        </div>

        <div>
          {product.dimensions ? <Dimensions dimensions={product.dimensions} /> : null}
          {rows.length ? (
            <ol className="ledger" aria-label="Specifications">
              {rows.map((row, index) => (
                <Reveal as="li" key={`${row.label}-${index}`} className="ledger__row" delay={index * 0.05}>
                  <span className="ledger__num">{padNumber(index + 1)}</span>
                  <span className="ledger__cell">
                    <span className="caps ledger__label">{row.label}</span>
                    <span className="ledger__value">{row.value}</span>
                  </span>
                </Reveal>
              ))}
            </ol>
          ) : null}
          {product.materials ? (
            <Reveal delay={0.1}>
              <p className="details__materials" style={{ marginTop: '2rem' }}>
                <span className="caps muted">Materials — </span>
                {product.materials}
              </p>
            </Reveal>
          ) : null}
        </div>
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
    <Reveal as="dl" className="dims" style={{ marginBottom: '2.5rem' }}>
      {entries.map(([label, value]) => (
        <div key={label}>
          <dt className="caps dims__label">{label}</dt>
          <dd style={{ margin: 0 }}>
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
