import { classNames } from '../../lib/format.js'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import MediaReveal from '../ui/MediaReveal.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'
import RichText from '../ui/RichText.jsx'

/**
 * Editorial statement. Left-aligned blocks set the heading as a staggered
 * cascade beside a tall product crop (the page's product image, supplied by
 * BlockRenderer as `context.productImage`) so type and object read as one
 * composition rather than a centred text block.
 */
export default function EditorialText({ anchor_id, chapter, eyebrow, heading, body, alignment = 'left', size = 'display', context }) {
  const crop = alignment === 'left' && size === 'display' ? context?.productImage : null

  return (
    <section
      className={classNames('section section--tight editorial bleed', `editorial--${alignment}`, crop && 'editorial--with-crop')}
      id={anchor_id || undefined}
    >
      <div className="editorial__head">
        <Reveal>
          <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
        </Reveal>
        <Heading
          as="h2"
          text={heading}
          className={classNames('editorial__heading', size === 'display' ? 'display' : 'h2', crop && 'lines--stagger')}
        />
      </div>

      {crop ? (
        <MediaReveal className="editorial__crop" aria-hidden="true">
          <Picture image={crop} decorative sizes="(min-width: 1024px) 34vw, 100vw" />
        </MediaReveal>
      ) : null}

      {body ? (
        <Reveal delay={0.2} className="editorial__body">
          <RichText html={body} />
        </Reveal>
      ) : null}
    </section>
  )
}
