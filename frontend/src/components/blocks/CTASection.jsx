import { CmsButton } from '../ui/Button.jsx'
import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Picture from '../ui/Picture.jsx'
import Reveal from '../ui/Reveal.jsx'

export default function CTASection({ anchor_id, eyebrow, heading, body, primary_cta, secondary_cta, background_image }) {
  return (
    <section className="section cta" id={anchor_id || undefined}>
      {background_image ? (
        <div className="cta__bg" aria-hidden="true">
          <Picture image={background_image} decorative sizes="100vw" />
        </div>
      ) : null}
      <div className="container cta__inner">
        <Reveal>
          <Eyebrow plain>{eyebrow}</Eyebrow>
        </Reveal>
        <Heading as="h2" text={heading} className="display" />
        {body ? (
          <Reveal delay={0.15}>
            <p className="lede muted" style={{ maxWidth: '36rem' }}>
              {body}
            </p>
          </Reveal>
        ) : null}
        <Reveal delay={0.25} className="cta__actions">
          <CmsButton link={primary_cta} size="lg" />
          <CmsButton link={secondary_cta} size="lg" />
        </Reveal>
      </div>
    </section>
  )
}
