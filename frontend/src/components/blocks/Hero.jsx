import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

import { useCart } from '../../cart/CartContext.jsx'
import { classNames } from '../../lib/format.js'
import { parseHeading } from '../../lib/heading.js'
import { EASE_OUT } from '../../lib/motion.js'
import { useSite } from '../../site/SiteContext.jsx'
import Button, { CmsButton } from '../ui/Button.jsx'
import Picture from '../ui/Picture.jsx'
import HeroSequence from './HeroSequence.jsx'

const MOBILE_QUERY = '(max-width: 1023px)'

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false))
  useEffect(() => {
    const media = window.matchMedia(query)
    const apply = () => setMatches(media.matches)
    apply()
    media.addEventListener?.('change', apply)
    return () => media.removeEventListener?.('change', apply)
  }, [query])
  return matches
}

/**
 * The opening.
 *
 * With `frames` (locked-camera stills, closed → fully open) the hero is a
 * sticky 16:9 stage over a tall track: the case opens by itself in the first
 * seconds and can be scrubbed by scrolling. Phones get `mobile_frames`
 * (4:5) when present, else the desktop frames. Under reduced motion the
 * final open frame is shown as a still; without any frames the landscape
 * master (or the portrait `mobile_image` on phones) is used.
 *
 * Copy: `eyebrow` → campaign label, `tagline` → display statement (line
 * breaks and _italics_), `headline` → supporting line, `side_label` →
 * vertical edge line. "Watch the story" replays the opening; `add_to_bag`
 * only surfaces when there is no sequence to replay.
 */
export default function Hero({
  anchor_id,
  eyebrow,
  title,
  tagline,
  headline,
  body,
  image,
  mobile_image,
  frames = [],
  mobile_frames = [],
  side_label,
  add_to_bag = false,
  primary_cta,
  secondary_cta,
  scroll_hint,
  context,
}) {
  const reduceMotion = useReducedMotion()
  const isMobile = useMediaQuery(MOBILE_QUERY)
  const trackRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [replayKey, setReplayKey] = useState(0)

  const desktopFrames = frames.filter((frame) => frame && frame.src)
  const phoneFrames = mobile_frames.filter((frame) => frame && frame.src)
  const activeFrames = isMobile && phoneFrames.length >= 2 ? phoneFrames : desktopFrames
  const sequence = !reduceMotion && activeFrames.length >= 2
  // Still fallback (reduced motion / no frames): the final open frame when the
  // sequence exists, so nothing essential depends on the animation playing.
  const finalFrame = activeFrames[activeFrames.length - 1]
  const still = finalFrame || (isMobile && mobile_image ? mobile_image : image)

  const displayLines = parseHeading(tagline)
  const supportLines = parseHeading(headline)

  const enter = (delay) =>
    reduceMotion
      ? { initial: false }
      : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 1.1, ease: EASE_OUT, delay } }

  const revealed = progress > 0.96

  return (
    <section
      className={classNames('hero', sequence ? 'hero--sequence' : 'hero--still')}
      id={anchor_id || undefined}
      ref={trackRef}
      aria-labelledby="hero-title"
    >
      <div className="hero__sticky">
        {sequence ? (
          <HeroSequence
            key={isMobile ? 'mobile' : 'desktop'}
            frames={activeFrames}
            trackRef={trackRef}
            onProgress={setProgress}
            replayKey={replayKey}
            sizes="100vw"
          />
        ) : (
          <motion.div
            className="hero__stage"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.9, ease: EASE_OUT, delay: 0.15 }}
          >
            <div className="hero__frame hero__frame--final">
              <Picture image={still} className="hero__image" priority sizes="100vw" />
            </div>
          </motion.div>
        )}
        <div className="hero__shade" aria-hidden="true" />

        <div className="hero__copy bleed">
          <div className="hero__text">
            {eyebrow ? (
              <motion.p className="hero__label caps" {...enter(0.2)}>
                {eyebrow}
              </motion.p>
            ) : null}
            <h1 className="hero__title" id="hero-title">
              <motion.span className="wordmark hero__wordmark" {...enter(0.3)}>
                {title}
              </motion.span>
              {displayLines.length ? (
                <span className="t-campaign hero__display">
                  {displayLines.map((segments, index) => (
                    <span className="hero__display-line" key={index}>
                      <motion.span {...enter(0.45 + index * 0.12)}>
                        {segments.map((s, j) => (s.italic ? <em key={j}>{s.text}</em> : <span key={j}>{s.text}</span>))}
                      </motion.span>
                    </span>
                  ))}
                </span>
              ) : null}
            </h1>
            {supportLines.length ? (
              <motion.p className="hero__line lede" {...enter(0.85)}>
                {supportLines.map((segments, i) => (
                  <span key={i}>
                    {segments.map((s, j) => (s.italic ? <em key={j}>{s.text}</em> : <span key={j}>{s.text}</span>))}
                    {i < supportLines.length - 1 ? ' ' : null}
                  </span>
                ))}
              </motion.p>
            ) : null}
            <motion.div className="hero__actions" {...enter(1.05)}>
              <CmsButton link={primary_cta} className="btn--arrow" />
              {sequence ? (
                <button type="button" className="hero__watch caps" onClick={() => setReplayKey((key) => key + 1)}>
                  <span className="hero__watch-icon" aria-hidden="true" />
                  {revealed ? 'Watch again' : 'Watch the story'}
                </button>
              ) : add_to_bag ? (
                <HeroAddToBag product={context?.product} />
              ) : (
                <CmsButton link={secondary_cta} variant="text" />
              )}
            </motion.div>
            {body ? (
              <motion.p className="hero__body caption" {...enter(1.2)}>
                {body}
              </motion.p>
            ) : null}
          </div>

          {side_label ? (
            <motion.p className="hero__side caps" {...enter(1.3)}>
              <span>{side_label}</span>
              <span className="hero__side-rule" aria-hidden="true" />
            </motion.p>
          ) : null}

          {scroll_hint ? (
            <motion.div className="hero__foot" {...enter(1.4)}>
              <span className={classNames('hero__scroll caps', revealed && 'hero__scroll--faded')} aria-hidden="true">
                {scroll_hint}
                <span className="hero__scroll-line" />
              </span>
            </motion.div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function HeroAddToBag({ product }) {
  const cart = useCart()
  const { site } = useSite()
  const target = product || site.featured_product
  if (!target) return null
  const canBuy = !target.availability || ['in_stock', 'low_stock'].includes(target.availability.status)
  return (
    <Button
      variant="text"
      onClick={() => cart.addItem({ slug: target.slug, quantity: 1 })}
      disabled={!canBuy || cart.pending}
      aria-busy={cart.pending}
    >
      {cart.pending ? 'Adding…' : canBuy ? 'Add to bag' : 'Sold out'}
    </Button>
  )
}
