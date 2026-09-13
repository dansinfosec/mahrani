import { classNames } from '../../lib/format.js'
import { CmsButton } from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import MediaReveal from '../ui/MediaReveal.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'
import RichText from '../ui/RichText.jsx'

/**
 * A chapter composition: the photograph runs edge to edge and the copy sits in
 * its negative space on the opposite side, with the chapter numeral set huge
 * behind the heading. `image_position` decides which side the object is on.
 */
export default function ImageText({ anchor_id, chapter, eyebrow, heading, body, image, image_position = 'right', cta }) {
  return (
    <section className={classNames('chapterblock bleed', `chapterblock--${image_position}`)} id={anchor_id || undefined}>
      <MediaReveal className="chapterblock__media">
        <Picture image={image} sizes="100vw" />
      </MediaReveal>
      <div className="chapterblock__shade" aria-hidden="true" />
      {chapter ? (
        <span className="chapterblock__numeral numeral" aria-hidden="true">
          {chapter}
        </span>
      ) : null}
      <div className="chapterblock__copy">
        <Reveal>
          <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
        </Reveal>
        <Heading as="h2" text={heading} className="display" />
        {body ? (
          <Reveal delay={0.15}>
            <RichText html={body} className="prose chapterblock__prose" />
          </Reveal>
        ) : null}
        <Reveal delay={0.25}>
          <CmsButton link={cta} variant="text" />
        </Reveal>
      </div>
    </section>
  )
}
