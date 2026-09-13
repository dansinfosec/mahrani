// Shared easing/timing so motion feels like one system.
export const EASE_OUT = [0.16, 1, 0.3, 1]
export const EASE_IN_OUT = [0.65, 0, 0.35, 1]

export const viewportOnce = { once: true, margin: '0px 0px -12% 0px' }
// Same thresholds for useInView(ref) — used where the animated element itself
// would be clipped away in its hidden state (masked lines, clip reveals).
export const inViewOptions = { once: true, margin: '0px 0px -10% 0px' }

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 1, ease: EASE_OUT, delay },
  }),
}

export const fade = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({ opacity: 1, transition: { duration: 1.2, ease: 'easeOut', delay } }),
}

export const stagger = (staggerChildren = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
})

export const lineReveal = {
  hidden: { y: '110%' },
  visible: (delay = 0) => ({ y: '0%', transition: { duration: 1.1, ease: EASE_OUT, delay } }),
}

export const clipReveal = {
  hidden: { clipPath: 'inset(0 0 100% 0)', scale: 1.06 },
  visible: (delay = 0) => ({
    clipPath: 'inset(0 0 0% 0)',
    scale: 1,
    transition: { duration: 1.4, ease: EASE_OUT, delay },
  }),
}
