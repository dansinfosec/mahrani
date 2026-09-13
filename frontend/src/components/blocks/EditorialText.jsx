import { classNames } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Reveal from '../ui/Reveal.jsx'
import RichText from '../ui/RichText.jsx'

export default function EditorialText({ anchor_id, eyebrow, heading, body, alignment = 'left', size = 'display' }) {
  return (
    <section className="section" id={anchor_id || undefined}>
      <div className={classNames('container editorial', `editorial--${alignment}`)}>
        <div>
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Heading as="h2" text={heading} className={classNames('editorial__heading', size === 'display' ? 'display' : 'h2')} />
        </div>
        {body ? (
          <Reveal delay={0.2}>
            <RichText html={body} className="editorial__body" />
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
