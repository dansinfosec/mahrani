import { padNumber } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import MediaReveal from '../ui/MediaReveal.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

/**
 * "Beauty in every layer": the three 4:3 layer photographs as one editorial
 * row on desktop (sharp edges, hairline captions, no cards) and as a stack of
 * full-width features on phones. Copy is minimal: the layer number and name,
 * then what it holds. Layers come from the product via the CMS block.
 */
export default function DrawerShowcase({ anchor_id, chapter, eyebrow, heading, intro, layers = [] }) {
  if (!layers.length) return null
  return (
    <section className="section layers" id={anchor_id || undefined}>
      <div className="container">
        <div className="layers__head">
          <div>
            <Reveal>
              <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
            </Reveal>
            <Heading as="h2" text={heading} className="h2" />
          </div>
          {intro ? (
            <Reveal delay={0.15}>
              <p className="layers__intro caption">{intro}</p>
            </Reveal>
          ) : null}
        </div>

        <ol className="layers__row">
          {layers.map((layer, index) => {
            const number = padNumber(layer.number ?? index + 1)
            const holds = layer.items?.length ? layer.items.join(', ') : layer.description
            return (
              <li className="layer" key={layer.number ?? index}>
                {layer.image ? (
                  <MediaReveal className="layer__media" delay={index * 0.1}>
                    <Picture image={layer.image} sizes="(min-width: 1024px) 31vw, 100vw" />
                  </MediaReveal>
                ) : null}
                <Reveal className="layer__caption" delay={0.1 + index * 0.08}>
                  <p className="layer__name caps">
                    <span className="layer__name-num">{number}</span>
                    <span className="sr-only">Layer {number}: </span>
                    {layer.name}
                  </p>
                  {holds ? <p className="layer__holds">{holds}.</p> : null}
                </Reveal>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
