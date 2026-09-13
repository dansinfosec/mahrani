import { motion } from 'framer-motion'

import { padNumber } from '../../lib/format.js'
import { clipReveal, viewportOnce } from '../../lib/motion.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

/**
 * "Beauty in every layer": one editorial row per drawer. Layers come from the
 * product (commerce) via the CMS block, so the copy and imagery can change
 * without touching React.
 */
export default function DrawerShowcase({ anchor_id, eyebrow, heading, intro, layers = [] }) {
  if (!layers.length) return null
  return (
    <section className="section layers" id={anchor_id || undefined}>
      <div className="container">
        <div className="layers__head">
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Heading as="h2" text={heading} className="display" />
          {intro ? (
            <Reveal delay={0.15}>
              <p className="lede muted">{intro}</p>
            </Reveal>
          ) : null}
        </div>

        <ol>
          {layers.map((layer, index) => (
            <li className="layer" key={layer.number ?? index}>
              <div className="layer__copy">
                <Reveal>
                  <div className="layer__index">
                    <span className="layer__number" aria-hidden="true">
                      {padNumber(layer.number ?? index + 1)}
                    </span>
                    <span className="layer__name">
                      <span className="sr-only">Layer {padNumber(layer.number ?? index + 1)}: </span>
                      {layer.name}
                    </span>
                  </div>
                </Reveal>
                <Heading as="h3" text={layer.title || layer.name} className="h2" />
                {layer.description ? (
                  <Reveal delay={0.15}>
                    <p className="layer__text">{layer.description}</p>
                  </Reveal>
                ) : null}
                {layer.items?.length ? (
                  <Reveal as="ul" delay={0.25} className="layer__items" aria-label={`${layer.name} contents`}>
                    {layer.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </Reveal>
                ) : null}
              </div>

              {layer.image ? (
                <motion.figure className="layer__media" variants={clipReveal} initial="hidden" whileInView="visible" viewport={viewportOnce}>
                  <div className="layer__frame">
                    <Picture image={layer.image} sizes="(min-width: 1024px) 30rem, 26rem" />
                  </div>
                </motion.figure>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
