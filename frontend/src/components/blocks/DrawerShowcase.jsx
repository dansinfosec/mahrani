import { classNames, padNumber } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import MediaReveal from '../ui/MediaReveal.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

/**
 * "Beauty in every layer": one editorial row per drawer, alternating sides,
 * with the layer numeral set huge behind the imagery. Layers come from the
 * product via the CMS block, so copy and imagery change without touching React.
 */
export default function DrawerShowcase({ anchor_id, chapter, eyebrow, heading, intro, layers = [] }) {
  if (!layers.length) return null
  return (
    <section className="section layers bleed" id={anchor_id || undefined}>
      <div className="layers__head">
        <div>
          <Reveal>
            <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
          </Reveal>
          <Heading as="h2" text={heading} className="display" />
        </div>
        {intro ? (
          <Reveal delay={0.15}>
            <p className="layers__intro lede muted">{intro}</p>
          </Reveal>
        ) : null}
      </div>

      <ol className="layers__list">
        {layers.map((layer, index) => {
          const number = padNumber(layer.number ?? index + 1)
          return (
            <li className={classNames('layer', index % 2 === 1 && 'layer--flip')} key={layer.number ?? index}>
              <span className="layer__numeral numeral" aria-hidden="true">
                {number}
              </span>

              {layer.image ? (
                <MediaReveal className="layer__media">
                  <Picture image={layer.image} sizes="(min-width: 1024px) 44vw, 100vw" />
                </MediaReveal>
              ) : null}

              <div className="layer__copy">
                <Reveal>
                  <p className="layer__name caps">
                    <span className="layer__name-num">{number}</span>
                    <span className="sr-only">Layer {number}: </span>
                    {layer.name}
                  </p>
                </Reveal>
                <Heading as="h3" text={layer.title || layer.name} className="h2" />
                {layer.description ? (
                  <Reveal delay={0.12}>
                    <p className="layer__text">{layer.description}</p>
                  </Reveal>
                ) : null}
                {layer.items?.length ? (
                  <Reveal as="ul" delay={0.2} className="layer__items" aria-label={`${layer.name} contents`}>
                    {layer.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </Reveal>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
