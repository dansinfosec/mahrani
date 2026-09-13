import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Reveal from '../ui/Reveal.jsx'

export default function Video({ anchor_id, eyebrow, heading, video_url, embed, poster, autoplay = true, loop = true, caption }) {
  if (!video_url && !embed) return null
  return (
    <section className="section" id={anchor_id || undefined}>
      <div className="container video">
        {(eyebrow || heading) && (
          <div>
            <Eyebrow>{eyebrow}</Eyebrow>
            <Heading as="h2" text={heading} className="h2" />
          </div>
        )}
        <Reveal variant="fade">
          <div className="video__frame">
            {video_url ? (
              <video
                src={video_url}
                poster={poster?.sizes?.large || poster?.src}
                autoPlay={autoplay}
                muted={autoplay}
                loop={loop}
                playsInline
                controls={!autoplay}
                preload="metadata"
              />
            ) : (
              <div dangerouslySetInnerHTML={{ __html: embed }} />
            )}
          </div>
        </Reveal>
        {caption ? <p className="video__caption">{caption}</p> : null}
      </div>
    </section>
  )
}
