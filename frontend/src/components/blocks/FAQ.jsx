import Accordion from '../ui/Accordion.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Reveal from '../ui/Reveal.jsx'

export default function FAQ({ anchor_id, eyebrow, heading, items = [] }) {
  if (!items.length) return null
  return (
    <section className="section" id={anchor_id || undefined}>
      <div className="container faq__inner">
        <div className="faq__head">
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Heading as="h2" text={heading} className="h2" />
        </div>
        <Reveal delay={0.1}>
          <Accordion items={items} headingLevel={3} />
        </Reveal>
      </div>
    </section>
  )
}
