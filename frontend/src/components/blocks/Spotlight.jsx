import { motion } from 'framer-motion'

import { classNames } from '../../lib/format.js'
import { EASE_OUT, viewportOnce } from '../../lib/motion.js'
import { CmsButton } from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'
import RichText from '../ui/RichText.jsx'

/**
 * The darkest moment on the page. The mirror image runs large to the edge,
 * the heading overlaps it, and a warm glow "switches on" as the section
 * scrolls into view — the one light effect the site allows itself.
 * Highlights render as two hairlined lines of copy, not cards.
 */
export default function Spotlight({ anchor_id, chapter, eyebrow, heading, body, image, glow = 'warm', highlights = [], cta }) {
  return (
    <section className={classNames('section spotlight bleed', glow === 'none' && 'spotlight--no-glow')} id={anchor_id || undefined}>
      {glow !== 'none' ? (
        <motion.div
          className={classNames('spotlight__glow', glow === 'soft' && 'spotlight__glow--soft')}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 2.4, ease: 'easeOut', delay: 0.2 }}
        />
      ) : null}

      {image ? (
        <motion.figure
          className="spotlight__media"
          initial={{ opacity: 0, scale: 1.04, filter: 'brightness(0.55)' }}
          whileInView={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
          viewport={viewportOnce}
          transition={{ duration: 2, ease: EASE_OUT }}
        >
          <Picture image={image} sizes="(min-width: 1024px) 56vw, 100vw" />
        </motion.figure>
      ) : null}

      <div className="spotlight__copy">
        <Reveal>
          <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
        </Reveal>
        <Heading as="h2" text={heading} className="display-xl spotlight__heading" />
      </div>

      <div className="spotlight__body">
        <Reveal delay={0.15}>
          <RichText html={body} className="prose spotlight__prose" />
        </Reveal>
        {highlights.length ? (
          <ul className="spotlight__lines">
            {highlights.map((item, index) => (
              <Reveal as="li" key={index} className="spotlight__line" delay={0.2 + index * 0.1}>
                <span className="caps spotlight__line-title">{item.title}</span>
                {item.description ? <span className="spotlight__line-text">{item.description}</span> : null}
              </Reveal>
            ))}
          </ul>
        ) : null}
        <Reveal delay={0.3}>
          <CmsButton link={cta} variant="secondary" />
        </Reveal>
      </div>
    </section>
  )
}
