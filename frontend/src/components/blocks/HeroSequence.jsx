import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'

import { classNames } from '../../lib/format.js'
import Picture from '../ui/Picture.jsx'

const INTRO_SECONDS = 6.5

/**
 * The opening: a stack of same-camera frames (closed case → fully revealed)
 * dissolved by a single 0→1 progress value. Progress is the greater of two
 * inputs — a timed intro that plays once the first frame has loaded, and the
 * scroll position through the hero's track — so the case opens on its own in
 * the first seconds and the visitor can also scrub it by scrolling. Nothing
 * hijacks the scroll: the stage is simply sticky for the length of the track.
 *
 * Adjacent frames crossfade linearly, so with eight frames the object reads
 * as opening in seven soft steps rather than jumping between stills.
 */
export default function HeroSequence({ frames, trackRef, onProgress, replayKey = 0, sizes }) {
  const introValue = useMotionValue(0)
  const [ready, setReady] = useState(false)
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })
  const progress = useTransform([introValue, scrollYProgress], ([intro, scroll]) => Math.max(intro, scroll))
  const scale = useTransform(progress, [0, 1], [1.045, 1])
  const last = frames.length - 1

  // Intro: ease the case open once the first frame is decoded.
  useEffect(() => {
    if (!ready) return undefined
    introValue.set(0)
    const controls = animate(introValue, 1, { duration: INTRO_SECONDS, ease: [0.55, 0.05, 0.25, 1], delay: 0.6 })
    return () => controls.stop()
  }, [ready, replayKey, introValue])

  useMotionValueEvent(progress, 'change', (value) => onProgress?.(value))

  return (
    <motion.div className="hero__stage" style={{ scale }}>
      {frames.map((frame, index) => (
        <Frame
          key={frame.id ?? index}
          frame={frame}
          index={index}
          last={last}
          progress={progress}
          sizes={sizes}
          onFirstLoad={index === 0 ? () => setReady(true) : undefined}
        />
      ))}
    </motion.div>
  )
}

function Frame({ frame, index, last, progress, sizes, onFirstLoad }) {
  const position = index / Math.max(1, last)
  const step = 1 / Math.max(1, last)
  const opacity = useTransform(progress, (value) => {
    const distance = Math.abs(value - position) / step
    return Math.max(0, Math.min(1, 1 - distance))
  })
  // z-order: later frames on top so the open state always wins ties.
  const priority = index === 0 || index === last
  const ref = useRef(null)
  useEffect(() => {
    if (!onFirstLoad) return
    const img = ref.current?.querySelector('img')
    if (!img) return
    if (img.complete) onFirstLoad()
    else img.addEventListener('load', onFirstLoad, { once: true })
  }, [onFirstLoad])

  return (
    <motion.div ref={ref} className={classNames('hero__frame', index === last && 'hero__frame--final')} style={{ opacity, zIndex: index + 1 }} aria-hidden={index !== last}>
      <Picture image={frame} className="hero__image" priority={priority} sizes={sizes} decorative={index !== last} />
    </motion.div>
  )
}

