import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

import { parseHeading } from '../../lib/heading.js'
import { EASE_OUT } from '../../lib/motion.js'
import { useSite } from '../../site/SiteContext.jsx'
import { CmsButton } from '../ui/Button.jsx'
import Picture from '../ui/Picture.jsx'

/**
 * Campaign hero. The CMS tagline ("BEAUTY IN EVERY LAYER") becomes the display
 * statement, set as three lines: first word / middle words in italic / last
 * word. The CMS headline becomes the small editorial line beneath it.
 */
function splitTagline(tagline) {
  const words = String(tagline || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return []
  if (words.length <= 3) return words.map((word) => [word])
  return [[words[0]], words.slice(1, -1), [words[words.length - 1]]]
}

export default function Hero({ anchor_id, eyebrow, title, tagline, headline, body, image, primary_cta, secondary_cta, scroll_hint }) {
  const { site } = useSite()
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', reduceMotion ? '0%' : '12%'])
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', reduceMotion ? '0%' : '-6%'])
  const fadeOut = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  const displayLines = splitTagline(tagline)
  const editorialLine = parseHeading(headline)
  const collaboration = site.collaboration.enabled ? `${site.collaboration.label} ${site.collaboration.partner_name}`.trim() : null
  const year = new Date().getFullYear()

  // Under reduced motion the hero simply appears; no entrance choreography.
  const enter = (delay) =>
    reduceMotion
      ? { initial: false }
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1.1, ease: EASE_OUT, delay },
        }

  return (
    <section className="hero bleed" id={anchor_id || undefined} ref={ref} aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true" />

      <motion.div className="hero__copy" style={{ y: copyY }}>
        {eyebrow || collaboration ? (
          <motion.p className="hero__label caps" {...enter(0.1)}>
            <span>{collaboration || eyebrow}</span>
            <span className="hero__label-rule" aria-hidden="true" />
            <span className="hero__label-year">{year} Collection</span>
          </motion.p>
        ) : null}

        <h1 className="hero__title" id="hero-title">
          <motion.span className="wordmark hero__wordmark" {...enter(0.2)}>
            {title}
          </motion.span>
          {displayLines.length ? (
            <span className="t-campaign hero__display">
              {displayLines.map((line, index) => {
                const italic = displayLines.length === 3 && index === 1
                return (
                  <span className="hero__display-line" key={index}>
                    <motion.span className={italic ? 'italic-line' : 'caps-line'} {...enter(0.3 + index * 0.1)}>
                      {line.join(' ')}
                    </motion.span>
                  </span>
                )
              })}
            </span>
          ) : null}
        </h1>

        {editorialLine.length ? (
          <motion.p className="hero__line lede" {...enter(0.65)}>
            {editorialLine.map((segments, i) => (
              <span key={i}>
                {segments.map((s, j) => (s.italic ? <em key={j}>{s.text}</em> : <span key={j}>{s.text}</span>))}
                {i < editorialLine.length - 1 ? ' ' : null}
              </span>
            ))}
          </motion.p>
        ) : null}

        <motion.div className="hero__actions" {...enter(0.8)}>
          <CmsButton link={primary_cta} size="lg" />
          <CmsButton link={secondary_cta} variant="text" />
        </motion.div>
      </motion.div>

      <motion.div
        className="hero__media"
        style={{ y: imageY }}
        initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.9, ease: EASE_OUT, delay: 0.15 }}
      >
        <div className="hero__halo" aria-hidden="true" />
        <Picture image={image} className="hero__image" priority sizes="(min-width: 1024px) 40vw, 86vw" />
      </motion.div>

      <motion.aside className="hero__meta" {...enter(0.9)}>
        {body ? <p className="hero__body caption">{body}</p> : null}
        {scroll_hint ? (
          <motion.span className="hero__scroll caps" style={{ opacity: fadeOut }} aria-hidden="true">
            <span className="hero__scroll-line" />
            {scroll_hint}
          </motion.span>
        ) : null}
      </motion.aside>
    </section>
  )
}
