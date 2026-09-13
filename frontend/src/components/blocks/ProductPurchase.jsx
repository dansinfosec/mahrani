import PurchasePanel from '../product/PurchasePanel.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import MediaReveal from '../ui/MediaReveal.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

/**
 * The climax of the page: the object at full height on one side, the offer on
 * the other. Same PurchasePanel as the product page — only the stage differs.
 */
export default function ProductPurchase({ anchor_id, chapter, eyebrow, heading, product, image, show_shipping = true, note }) {
  if (!product) return null
  const media = image || product.primary_image
  return (
    <section className="purchase bleed" id={anchor_id || 'shop'}>
      {media ? (
        <MediaReveal className="purchase__media">
          <Picture image={media} sizes="(min-width: 1024px) 50vw, 100vw" />
        </MediaReveal>
      ) : null}

      <div className="purchase__panel">
        <div className="purchase__head">
          <Reveal>
            <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
          </Reveal>
          <Heading as="h2" text={heading} className="display purchase__heading" />
        </div>
        <Reveal delay={0.1}>
          <PurchasePanel product={product} headingLevel={3} showShipping={show_shipping} note={note} />
        </Reveal>
      </div>
    </section>
  )
}
