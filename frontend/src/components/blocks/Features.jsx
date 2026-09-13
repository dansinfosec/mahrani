import { SmartLink } from '../ui/Button.jsx'
import { classNames, padNumber } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Icon from '../ui/Icon.jsx'
import Reveal from '../ui/Reveal.jsx'

/**
 * Feature list. The default "row" layout is a numbered hairline rail — used on
 * the campaign home as the chapter index, where each item links to its
 * section. The "grid" layout keeps icons for pages that ask for it.
 */
export default function Features({ anchor_id, chapter, eyebrow, heading, items = [], layout = 'row' }) {
  if (!items.length) return null

  if (layout === 'row') {
    return (
      <nav className="strip" id={anchor_id || undefined} aria-label={heading || 'Chapters'}>
        <div className="container">
          {(eyebrow || heading) && (
            <div className="strip__head">
              <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
              <Heading as="h2" text={heading} className="h3" />
            </div>
          )}
          <Reveal as="ol" variant="fade" className="strip__list">
            {items.map((item, index) => {
              const inner = (
                <>
                  <span className="strip__num" aria-hidden="true">
                    {padNumber(index + 1)}
                  </span>
                  <span className="strip__title">{item.title}</span>
                  {item.description ? <span className="sr-only">. {item.description}</span> : null}
                </>
              )
              return (
                <li key={index} className="strip__item">
                  {item.link ? (
                    <SmartLink href={item.link} className="strip__link">
                      {inner}
                    </SmartLink>
                  ) : (
                    inner
                  )}
                </li>
              )
            })}
          </Reveal>
        </div>
      </nav>
    )
  }

  return (
    <section className={classNames('features section--tight', `features--${layout}`)} id={anchor_id || undefined}>
      <div className="container">
        {(eyebrow || heading) && (
          <div className="features__head">
            <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
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
