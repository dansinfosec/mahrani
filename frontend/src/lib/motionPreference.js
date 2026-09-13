/**
 * Mirrors prefers-reduced-motion onto <html class="reduce-motion"> so CSS and
 * Framer Motion agree. `?motion=1` forces full motion and `?motion=0` forces
 * reduced motion in any environment, so both paths can be reviewed on any
 * machine regardless of the OS setting.
 */
export function setupMotionPreference() {
  if (typeof window === 'undefined' || !window.matchMedia) return

  {
    const override = new URLSearchParams(window.location.search).get('motion')
    if (override === '1' || override === '0') {
      const forced = override === '0'
      const original = window.matchMedia.bind(window)
      window.matchMedia = (query) => {
        if (/prefers-reduced-motion/.test(query)) {
          const wantsReduce = /reduce/.test(query)
          return {
            matches: wantsReduce ? forced : !forced,
            media: query,
            onchange: null,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
            dispatchEvent: () => false,
          }
        }
        return original(query)
      }
    }
  }

  const media = window.matchMedia('(prefers-reduced-motion: reduce)')
  const apply = () => document.documentElement.classList.toggle('reduce-motion', media.matches)
  apply()
  media.addEventListener?.('change', apply)
}
