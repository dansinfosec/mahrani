import { classNames } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

export default function Gallery({ anchor_id, eyebrow, heading, images = [], layout = 'mosaic' }) {
  const items = images.filter(Boolean)
  if (!items.length) return null
  return (
    <section className={classNames('section gallery', `gallery--${layout}`)} id={anchor_id || undefined}>
      <div className="container">
        {(eyebrow || heading) && (
          <div className="gallery__head">
            <Eyebrow>{eyebrow}</Eyebrow>
            <Heading as="h2" text={heading} className="h2" />
          </div>
        )}
        <ul className="gallery__grid">
          {items.map((image, index) => (
            <Reveal as="li" key={image.id || index} className="gallery__item" variant="fade" delay={index * 0.06}>
              <Picture image={image} sizes="(min-width: 768px) 25vw, 50vw" />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
