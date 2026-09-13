import { useLayoutEffect } from 'react'

let locks = 0

export function useLockBodyScroll(locked) {
  useLayoutEffect(() => {
    if (!locked) return undefined
    locks += 1
    const { overflow, paddingRight } = document.body.style
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    return () => {
      locks -= 1
      if (locks === 0) {
        document.body.style.overflow = overflow
        document.body.style.paddingRight = paddingRight
      }
    }
  }, [locked])
}
