import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'

import { classNames, padNumber } from '../../lib/format.js'
import { parseHeading } from '../../lib/heading.js'
import { EASE_OUT } from '../../lib/motion.js'
import Button from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Picture from '../ui/Picture.jsx'

const AUTO_ADVANCE_MS = 4200

/**
 * "Closed. Opened. Illuminated." — a single-viewport stage.
 *
 * The CMS stages crossfade inside one large frame. While the section is in
 * view the stage advances on its own; choosing a stage stops that. Under
 * reduced motion nothing auto-advances and stages swap without fading. The
 * same stage list can later be driven by a frame sequence or video via
 * `media_mode`, which the CMS already exposes.
 */
export default function ProductReveal({ anchor_id, eyebrow, heading, intro, stages = [], product }) {
  const reduceMotion = useReducedMotion()
  const usable = stages.filter((stage) => stage.image)
  const ref = useRef(null)
  const inView = useInView(ref, { amount: 0.45 })
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const auto = !reduceMotion && !paused && inView && usable.length > 1

  useEffect(() => {
    if (!auto) return undefined
    const id = window.setInterval(() => setActive((current) => (current + 1) % usable.length), AUTO_ADVANCE_MS)
    return () => window.clearInterval(id)
  }, [auto, usable.length, active])

  if (usable.length === 0) return null
  const stage = usable[Math.min(active, usable.length - 1)]

  const choose = (index) => {
    setPaused(true)
    setActive(index)
  }

  return (
    <section className={classNames('stage bleed', auto && 'stage--auto')} id={anchor_id || undefined} ref={ref} aria-label={eyebrow || 'Product reveal'}>
      <div className="stage__copy">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Heading as="h2" text={heading} className="display stage__heading" />
        {intro ? <p className="stage__intro muted">{intro}</p> : null}
      </div>

      <div className="stage__frame">
        <div className={classNames('stage__halo', stage.glow && 'stage__halo--on')} aria-hidden="true" />
        {usable.map((item, index) => (
          <div key={index} className={classNames('stage__layer', index === active && 'stage__layer--active')} aria-hidden={index !== active}>
            <Picture image={item.image} sizes="(min-width: 1024px) 46vw, 100vw" priority={index === 0} />
          </div>
        ))}
        <span className="stage__index caps" aria-hidden="true">
          {padNumber(active + 1)} / {padNumber(usable.length)}
        </span>
      </div>

      <div className="stage__foot">
        <ol className="stage__rail" aria-label="Stages">
          {usable.map((item, index) => (
            <li key={index}>
              <button
                type="button"
                className={classNames('stage__step', index === active && 'stage__step--active')}
                aria-current={index === active ? 'step' : undefined}
                onClick={() => choose(index)}
              >
                <span className="stage__step-num">{padNumber(index + 1)}</span>
                <span className="stage__step-label">{item.label}</span>
                <span className="stage__step-bar" aria-hidden="true" key={`${index}-${active}`} />
              </button>
            </li>
          ))}
        </ol>

        <div className="stage__caption-wrap">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={active}
              className="stage__caption"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
            >
              <CaptionText text={stage.caption || stage.label} />
            </motion.p>
          </AnimatePresence>
        </div>

        {product ? (
          <Button variant="text" href={product.url} className="stage__more">
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
