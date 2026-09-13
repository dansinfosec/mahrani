import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'

import { parseHeading } from '../../lib/heading.js'
import { classNames } from '../../lib/format.js'
import { inViewOptions, lineReveal } from '../../lib/motion.js'

/**
 * Renders CMS heading text (line breaks + _italics_) with a masked
 * line-by-line reveal. The heading element is observed; the translated inner
 * spans are what animate, so the observer never watches a clipped-away box.
 */
export default function Heading({
  as: Tag = 'h2',
  text,
  className,
  animate = true,
  delay = 0,
  id,
}) {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const inView = useInView(ref, inViewOptions)
  const lines = parseHeading(text)
  if (lines.length === 0) return null
  const shouldAnimate = animate && !reduceMotion

  return (
    <Tag className={classNames('lines', className)} id={id} ref={ref}>
      {lines.map((segments, index) => (
        <span className="lines__line" key={index}>
          {shouldAnimate ? (
            <motion.span
              className="lines__inner"
              variants={lineReveal}
              custom={delay + index * 0.09}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
            >
              <Segments segments={segments} />
            </motion.span>
          ) : (
            <span className="lines__inner">
              <Segments segments={segments} />
            </span>
          )}
        </span>
      ))}
    </Tag>
  )
}

function Segments({ segments }) {
  return segments.map((segment, index) =>
    segment.italic ? <em key={index}>{segment.text}</em> : <span key={index}>{segment.text}</span>,
  )
}
