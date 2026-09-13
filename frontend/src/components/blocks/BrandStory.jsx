import { Fragment } from 'react'
import { CmsButton } from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import MediaReveal from '../ui/MediaReveal.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'
import RichText from '../ui/RichText.jsx'

/**
 * The house. The brand words run as vertical type down the edge of the
 * portrait on desktop and as a small tracked line above it on mobile.
 */
export default function BrandStory({ anchor_id, chapter, words = [], eyebrow, heading, body, image, cta }) {
  return (
    <section className="section story bleed" id={anchor_id || undefined}>
      {words.length ? (
        <Reveal as="p" variant="fade" className="story__words wordmark" aria-label={words.join(', ')}>
          {words.map((word, index) => (
            <Fragment key={word + index}>
              {index > 0 ? <span className="story__dot" aria-hidden="true" /> : null}
              <span className="story__word">{word}</span>
            </Fragment>
          ))}
        </Reveal>
      ) : null}

      {image ? (
        <MediaReveal className="story__media">
          <Picture image={image} sizes="(min-width: 1024px) 30vw, 80vw" />
        </MediaReveal>
      ) : null}

      <div className="story__copy">
        <Reveal>
          <Eyebrow chapter={chapter}>{eyebrow}</Eyebrow>
        </Reveal>
        <Heading as="h2" text={heading} className="h2" />
        <Reveal delay={0.15}>
          <RichText html={body} />
        </Reveal>
        <Reveal delay={0.25}>
          <CmsButton link={cta} />
        </Reveal>
      </div>
    </section>
  )
}
