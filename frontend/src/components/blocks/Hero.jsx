import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

import { parseHeading } from '../../lib/heading.js'
import { EASE_OUT } from '../../lib/motion.js'
import { useSite } from '../../site/SiteContext.jsx'
import { CmsButton } from '../ui/Button.jsx'
import Picture from '../ui/Picture.jsx'

export default function Hero({ anchor_id, eyebrow, title, tagline, headline, body, image, primary_cta, secondary_cta, scroll_hint }) {
  const { site } = useSite()
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', reduceMotion ? '0%' : '18%'])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', reduceMotion ? '0%' : '-8%'])
  const fadeOut = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const headlineLines = parseHeading(headline)
  const collaboration = site.collaboration.enabled ? `${site.collaboration.label} ${site.collaboration.partner_name}`.trim() : null
  const eyebrowText = collaboration || eyebrow

  // Under reduced motion the hero simply appears; no entrance choreography.
  const enter = (delay) =>
    reduceMotion
      ? { initial: false }
      : {
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1.1, ease: EASE_OUT, delay },
        }

  return (
    <section className="hero" id={anchor_id || undefined} ref={ref} aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true" />
      <div className="container hero__inner">
        <motion.div className="hero__copy" style={{ y: copyY }}>
          {eyebrowText ? (
            <motion.p className="eyebrow hero__eyebrow" {...enter(0.1)}>
              {eyebrowText}
            </motion.p>
          ) : null}
          <motion.h1 className="hero__title" id="hero-title" {...enter(0.2)}>
            {title}
          </motion.h1>
          {tagline ? (
            <motion.p className="hero__tagline" {...enter(0.35)}>
              {tagline}
            </motion.p>
          ) : null}
          {headlineLines.length ? (
            <motion.p className="hero__headline" {...enter(0.5)}>
              {headlineLines.map((segments, i) => (
                <span key={i}>
                  {segments.map((s, j) => (s.italic ? <em key={j}>{s.text}</em> : <span key={j}>{s.text}</span>))}
                  {i < headlineLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </motion.p>
          ) : null}
          {body ? (
            <motion.p className="hero__body" {...enter(0.65)}>
              {body}
            </motion.p>
          ) : null}
          <motion.div className="hero__actions" {...enter(0.8)}>
            <CmsButton link={primary_cta} size="lg" />
            <CmsButton link={secondary_cta} size="lg" />
          </motion.div>
        </motion.div>

        <motion.div
          className="hero__media"
          style={{ y: imageY }}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.8, ease: EASE_OUT, delay: 0.2 }}
        >
          <div className="hero__halo" aria-hidden="true" />
          <Picture image={image} className="hero__image" priority sizes="(min-width: 1024px) 30rem, (min-width: 768px) 26rem, 22rem" />
        </motion.div>
      </div>

      {scroll_hint ? (
        <motion.div className="hero__scroll" style={{ opacity: fadeOut }} aria-hidden="true">
          <span>{scroll_hint}</span>
          <span className="hero__scroll-line" />
        </motion.div>
      ) : null}
    </section>
  )
}
