import { motion } from 'framer-motion'

import { clipReveal, viewportOnce } from '../../lib/motion.js'
import PurchasePanel from '../product/PurchasePanel.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

export default function ProductPurchase({ anchor_id, eyebrow, heading, product, image, show_shipping = true, note }) {
  if (!product) return null
  const media = image || product.primary_image
  return (
    <section className="section purchase" id={anchor_id || 'shop'}>
      <div className="container purchase__inner">
        <div>
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Heading as="h2" text={heading} className="display" />
          {media ? (
            <motion.figure className="purchase__media" style={{ marginTop: '2.5rem' }} variants={clipReveal} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <Picture image={media} sizes="(min-width: 1024px) 30rem, 24rem" />
            </motion.figure>
          ) : null}
        </div>
        <Reveal delay={0.1}>
          <PurchasePanel product={product} headingLevel={3} showShipping={show_shipping} note={note} />
        </Reveal>
      </div>
    </section>
  )
}
