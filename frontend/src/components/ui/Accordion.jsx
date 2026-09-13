import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { EASE_OUT } from '../../lib/motion.js'
import RichText from './RichText.jsx'

/**
 * Accessible accordion: heading + button (aria-expanded / aria-controls) and a
 * region panel. One item open at a time by default.
 */
export default function Accordion({ items, headingLevel = 3, allowMultiple = false }) {
  const baseId = useId()
  const [open, setOpen] = useState(() => new Set())
  const HeadingTag = `h${headingLevel}`

  const toggle = (index) => {
    setOpen((current) => {
      const next = new Set(allowMultiple ? current : [])
      if (current.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  return (
    <div className="accordion">
      {items.map((item, index) => {
        const isOpen = open.has(index)
        const triggerId = `${baseId}-trigger-${index}`
        const panelId = `${baseId}-panel-${index}`
        return (
          <div className="accordion__item" key={index}>
            <HeadingTag>
              <button
                type="button"
                id={triggerId}
                className="accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
              >
                <span>{item.question}</span>
                <span className="accordion__icon" aria-hidden="true" />
              </button>
            </HeadingTag>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="accordion__panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: EASE_OUT }}
                >
                  <div className="accordion__body">
                    {typeof item.answer === 'string' ? <RichText html={item.answer} /> : item.answer}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
