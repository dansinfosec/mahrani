import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

import { clipReveal, inViewOptions } from '../../lib/motion.js'

/**
 * Slow clip + settle reveal for imagery. The *outer* element is what the
 * IntersectionObserver watches; the clip-path lives on an inner wrapper.
 * (Observing the clipped element itself yields a zero-area intersection and
 * the reveal may never fire.) Under reduced motion the media simply renders.
 */
export default function MediaReveal({ as: Tag = 'figure', className, children, delay = 0, ...rest }) {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const inView = useInView(ref, inViewOptions)
  const visible = reduceMotion || inView

  return (
    <Tag ref={ref} className={className} {...rest}>
      <motion.div
        className="media-reveal"
        variants={clipReveal}
        custom={delay}
        initial={reduceMotion ? false : 'hidden'}
        animate={visible ? 'visible' : 'hidden'}
      >
        {children}
      </motion.div>
    </Tag>
  )
}
