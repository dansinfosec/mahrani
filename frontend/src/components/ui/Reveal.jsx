import { motion } from 'framer-motion'

import { fade, fadeUp, viewportOnce } from '../../lib/motion.js'

/**
 * Fade/rise into view once. Wraps any element via `as`.
 */
export default function Reveal({ as = 'div', children, delay = 0, variant = 'up', className, ...rest }) {
  const Component = motion[as] || motion.div
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
