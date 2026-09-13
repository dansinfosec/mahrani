import { classNames } from '../../lib/format.js'
import { CmsButton } from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import MediaReveal from '../ui/MediaReveal.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'
import RichText from '../ui/RichText.jsx'

export default function ImageText({ anchor_id, eyebrow, heading, body, image, image_position = 'right', cta }) {
  return (
    <section className="section" id={anchor_id || undefined}>
      <div className={classNames('container imagetext', `imagetext--${image_position}`)}>
        <MediaReveal className="imagetext__media">
          <Picture image={image} sizes="(min-width: 1024px) 45vw, 100vw" />
        </MediaReveal>
        <div className="imagetext__copy">
          <Reveal>
            <Eyebrow>{eyebrow}</Eyebrow>
          </Reveal>
          <Heading as="h2" text={heading} className="h2" />
          <Reveal delay={0.15}>
            <RichText html={body} />
          </Reveal>
          <Reveal delay={0.25}>
            <CmsButton link={cta} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
