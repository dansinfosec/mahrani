import { classNames, padNumber } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Icon from '../ui/Icon.jsx'
import Reveal from '../ui/Reveal.jsx'

/**
 * Feature list. The default "row" layout is a single hairlined strip of
 * numbered labels — a ledger line, not an icon grid. The "grid" layout keeps
 * icons for pages that ask for it.
 */
export default function Features({ anchor_id, eyebrow, heading, items = [], layout = 'row' }) {
  if (!items.length) return null

  if (layout === 'row') {
    return (
      <section className="strip" id={anchor_id || undefined} aria-label={heading || 'Highlights'}>
        <div className="container">
          {(eyebrow || heading) && (
            <div className="strip__head">
              <Eyebrow>{eyebrow}</Eyebrow>
              <Heading as="h2" text={heading} className="h3" />
            </div>
          )}
          <Reveal as="ol" variant="fade" className="strip__list">
            {items.map((item, index) => (
              <li key={index} className="strip__item">
                <span className="strip__num" aria-hidden="true">
                  {padNumber(index + 1)}
                </span>
                <span className="strip__title">{item.title}</span>
                {item.description ? <span className="sr-only">. {item.description}</span> : null}
              </li>
            ))}
          </Reveal>
        </div>
      </section>
    )
  }

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
