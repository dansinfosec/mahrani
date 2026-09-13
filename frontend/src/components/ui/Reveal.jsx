import { motion, useReducedMotion } from 'framer-motion'

import { fade, fadeUp, viewportOnce } from '../../lib/motion.js'

/**
 * Fade/rise into view once. Wraps any element via `as`. Under reduced motion
 * the element is simply rendered in place.
 */
export default function Reveal({ as = 'div', children, delay = 0, variant = 'up', className, ...rest }) {
  const reduceMotion = useReducedMotion()
  const Component = motion[as] || motion.div
  if (reduceMotion) {
    return (
      <Component className={className} {...rest}>
        {children}
      </Component>
    )
  }
  return (
    <Component
      className={className}
      variants={variant === 'fade' ? fade : fadeUp}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      {...rest}
    >
      {children}
    </Component>
  )
}
