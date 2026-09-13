import { useState } from 'react'

import { padNumber } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import MediaReveal from '../ui/MediaReveal.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

/**
 * The compact-form chapter. The 16:9 "three centimetres" photograph runs
 * wide with the real measurements drawn on it as product-design annotations
 * (the 3 cm stack at the side, the 14.7 × 7.1 cm face beneath), and the
 * specifications read as a two-column editorial ledger under it. Everything
 * comes from the catalog Product.
 */
export default function ProductDetails({ anchor_id, chapter, eyebrow, heading, intro, product, extra_items = [], image }) {
  const [mediaBroken, setMediaBroken] = useState(false)
  if (!product) return null
  const rows = [...(product.specifications || []), ...extra_items]
  const media = mediaBroken ? null : image || product.primary_image
  const dims = product.dimensions

  return (
    <section className="section details bleed" id={anchor_id || undefined}>
      <div className="details__head">
        <Reveal>
          <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
        </Reveal>
        <Heading as="h2" text={heading} className="h2" />
        {intro ? (
          <Reveal delay={0.15}>
            <p className="muted measure">{intro}</p>
          </Reveal>
        ) : null}
      </div>

      {media ? (
        <div className="details__object">
          <MediaReveal className="details__media">
            <Picture image={media} sizes="(min-width: 1024px) 30vw, 70vw" onError={() => setMediaBroken(true)} />
          </MediaReveal>
          {dims ? (
            <Reveal variant="fade" delay={0.4} className="annot" aria-hidden="true">
              {dims.depth ? (
                <span className="annot__rule annot__rule--height">
                  <span className="annot__value">{dims.depth.cm} cm</span>
                </span>
              ) : null}
              {dims.height ? (
                <span className="annot__rule annot__rule--width">
                  <span className="annot__value">{dims.height.cm} cm</span>
                </span>
              ) : null}
              {dims.width ? (
                <span className="annot__rule annot__rule--depth">
                  <span className="annot__value">{dims.width.cm} cm</span>
                </span>
              ) : null}
            </Reveal>
          ) : null}
        </div>
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
        {dims ? <Dimensions dimensions={dims} /> : null}
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
