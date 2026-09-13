import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion'

import { classNames } from '../../lib/format.js'
import { parseHeading } from '../../lib/heading.js'
import { EASE_OUT } from '../../lib/motion.js'
import Button from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Picture from '../ui/Picture.jsx'

/**
 * Scroll-driven product reveal.
 *
 * Architecture: the section is `stages × 100vh` tall and the stage viewport is
 * sticky, so scrolling scrubs a 0→1 progress value. Today that progress picks
 * one of the CMS "stages" (still images that crossfade); the same progress
 * value can later drive a WebP frame sequence, a scrubbed <video>, or a
 * Three.js scene — `media_mode` is already exposed by the CMS for that.
 */
export default function ProductReveal({ anchor_id, eyebrow, heading, intro, media_mode = 'stills', stages = [], product }) {
  const reduceMotion = useReducedMotion()
  const usable = stages.filter((stage) => stage.image)
  if (usable.length === 0) return null

  if (reduceMotion || media_mode !== 'stills') {
    return <StaticReveal anchor_id={anchor_id} eyebrow={eyebrow} heading={heading} intro={intro} stages={usable} product={product} />
  }
  return <ScrollReveal anchor_id={anchor_id} eyebrow={eyebrow} heading={heading} intro={intro} stages={usable} product={product} />
}

function ScrollReveal({ anchor_id, eyebrow, heading, intro, stages, product }) {
  const ref = useRef(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    const index = Math.min(stages.length - 1, Math.max(0, Math.floor(value * stages.length)))
    if (index !== active) setActive(index)
  })

  const stage = stages[active]

  return (
    <section
      className="reveal"
      id={anchor_id || undefined}
      ref={ref}
      style={{ '--reveal-stages': stages.length }}
      aria-label={eyebrow || 'Product reveal'}
    >
      <div className="reveal__viewport container">
        <div className="reveal__head">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading as="h2" text={heading} className="display reveal__heading" />
          {intro ? <p className="muted">{intro}</p> : null}
        </div>

        <div className="reveal__stage" aria-live="off">
          <div className={classNames('reveal__halo', stage.glow && 'reveal__halo--on')} aria-hidden="true" />
          <div className="reveal__frame">
            {stages.map((item, index) => (
              <div key={index} className={classNames('reveal__layer', index === active && 'reveal__layer--active')} aria-hidden={index !== active}>
                <Picture image={item.image} sizes="(min-width: 1024px) 40vw, 80vw" priority={index === 0} />
              </div>
            ))}
          </div>
        </div>

        <div className="reveal__foot">
          <div className="reveal__progress" aria-hidden="true">
            <motion.div className="reveal__progress-bar" style={{ scaleX: scrollYProgress }} />
          </div>
          <ol className="reveal__rail" aria-label="Stages">
            {stages.map((item, index) => (
              <li key={index} className={classNames('reveal__dot', index === active && 'reveal__dot--active')} aria-current={index === active ? 'step' : undefined}>
                <span className="reveal__dot-label">{item.label}</span>
              </li>
            ))}
          </ol>
          <AnimatePresence mode="wait">
            <motion.p
              key={active}
              className="reveal__caption"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
            >
              <CaptionText text={stage.caption || stage.label} />
            </motion.p>
          </AnimatePresence>
          {product ? (
            <Button variant="text" href={product.url}>
              Discover {product.name}
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function StaticReveal({ anchor_id, eyebrow, heading, intro, stages, product }) {
  return (
    <section className="reveal reveal--static section" id={anchor_id || undefined}>
      <div className="container">
        <div className="reveal__head">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading as="h2" text={heading} className="display reveal__heading" animate={false} />
          {intro ? <p className="muted">{intro}</p> : null}
        </div>
        <ol className="reveal__static-grid">
          {stages.map((item, index) => (
            <li key={index} className="reveal__static-item">
              <Picture image={item.image} sizes="(min-width: 768px) 30vw, 90vw" />
              <span className="caps muted">{item.label}</span>
              <p className="reveal__caption">
                <CaptionText text={item.caption || item.label} />
              </p>
            </li>
          ))}
        </ol>
        {product ? (
          <Button variant="text" href={product.url}>
            Discover {product.name}
          </Button>
        ) : null}
      </div>
    </section>
  )
}

function CaptionText({ text }) {
  const lines = parseHeading(text)
  return lines.map((segments, i) => (
    <span key={i}>
      {segments.map((s, j) => (s.italic ? <em key={j} className="serif-italic">{s.text}</em> : <span key={j}>{s.text}</span>))}
      {i < lines.length - 1 ? ' ' : null}
    </span>
  ))
}
