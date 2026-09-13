import { Fragment } from 'react'
import { motion } from 'framer-motion'

import { clipReveal, EASE_OUT, viewportOnce } from '../../lib/motion.js'
import { CmsButton } from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'
import RichText from '../ui/RichText.jsx'

export default function BrandStory({ anchor_id, words = [], eyebrow, heading, body, image, cta }) {
  return (
    <section className="section story" id={anchor_id || undefined}>
      <div className="container">
        {words.length ? (
          <p className="story__words" aria-label={words.join(', ')}>
            {words.map((word, index) => (
              <Fragment key={word + index}>
                {index > 0 ? <span className="story__dot" aria-hidden="true" /> : null}
                <motion.span
                  className="story__word"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={viewportOnce}
                  transition={{ duration: 1, ease: EASE_OUT, delay: index * 0.15 }}
                >
                  {word}
                </motion.span>
              </Fragment>
            ))}
          </p>
        ) : null}

        <div className="story__inner">
          {image ? (
            <motion.figure className="story__media" variants={clipReveal} initial="hidden" whileInView="visible" viewport={viewportOnce}>
              <Picture image={image} sizes="22rem" />
            </motion.figure>
          ) : null}
          <div className="story__copy">
            <Reveal>
              <Eyebrow>{eyebrow}</Eyebrow>
            </Reveal>
            <Heading as="h2" text={heading} className="h2" />
            <Reveal delay={0.15}>
              <RichText html={body} />
            </Reveal>
            <Reveal delay={0.25}>
              <CmsButton link={cta} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
