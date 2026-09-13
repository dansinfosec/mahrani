import { motion } from 'framer-motion'

import { classNames } from '../../lib/format.js'
import { EASE_OUT, viewportOnce } from '../../lib/motion.js'
import { CmsButton } from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Icon from '../ui/Icon.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'
import RichText from '../ui/RichText.jsx'

/**
 * Dark, dramatic section. The glow "switches on" as it scrolls into view —
 * the one place the site allows itself a light effect, tied to the LED mirror.
 */
export default function Spotlight({ anchor_id, eyebrow, heading, body, image, glow = 'warm', highlights = [], cta }) {
  return (
    <section className="section spotlight" id={anchor_id || undefined}>
      {glow !== 'none' ? (
        <motion.div
          className={classNames('spotlight__glow', glow === 'soft' && 'spotlight__glow--soft')}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 2.2, ease: 'easeOut', delay: 0.3 }}
        />
      ) : null}
      <div className="container spotlight__inner">
        <div className="spotlight__copy">
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Heading as="h2" text={heading} className="display-xl spotlight__heading" />
          <Reveal delay={0.2}>
            <RichText html={body} />
          </Reveal>
          <Reveal delay={0.3}>
            <CmsButton link={cta} variant="secondary" />
          </Reveal>
          {highlights.length ? (
            <ul className="spotlight__highlights">
              {highlights.map((item, index) => (
                <Reveal as="li" key={index} className="feature" delay={0.2 + index * 0.1}>
                  <Icon name={item.icon} className="feature__icon" />
                  <h3 className="feature__title">{item.title}</h3>
                  {item.description ? <p className="feature__text">{item.description}</p> : null}
                </Reveal>
              ))}
            </ul>
          ) : null}
        </div>

        {image ? (
          <motion.figure
            className="spotlight__media"
            initial={{ opacity: 0, scale: 0.96, filter: 'brightness(0.6)' }}
            whileInView={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
            viewport={viewportOnce}
            transition={{ duration: 1.8, ease: EASE_OUT }}
          >
            <div className="spotlight__frame">
              <Picture image={image} sizes="(min-width: 1024px) 28rem, 24rem" />
            </div>
          </motion.figure>
        ) : null}
      </div>
    </section>
  )
}
