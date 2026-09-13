import { classNames } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Icon from '../ui/Icon.jsx'
import Reveal from '../ui/Reveal.jsx'

export default function Features({ anchor_id, eyebrow, heading, items = [], layout = 'row' }) {
  if (!items.length) return null
  return (
    <section className={classNames('features section--tight', `features--${layout}`)} id={anchor_id || undefined}>
      <div className="container">
        {(eyebrow || heading) && (
          <div className="features__head">
            <Eyebrow>{eyebrow}</Eyebrow>
            <Heading as="h2" text={heading} className="h2" />
          </div>
        )}
        <ul className="features__list">
          {items.map((item, index) => (
            <Reveal as="li" key={index} className="features__item feature" delay={index * 0.08}>
              <Icon name={item.icon} size="lg" className="feature__icon" />
              <h3 className="feature__title">{item.title}</h3>
              {item.description ? <p className="feature__text">{item.description}</p> : null}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
