import Reveal from '../ui/Reveal.jsx'

export default function Quote({ anchor_id, quote, attribution, role }) {
  if (!quote) return null
  return (
    <section className="section" id={anchor_id || undefined}>
      <Reveal as="figure" className="container--narrow container quote">
        <blockquote className="quote__text">“{quote}”</blockquote>
        {attribution ? (
          <figcaption className="quote__attribution">
            <span className="caps">{attribution}</span>
            {role ? <span className="muted">{role}</span> : null}
          </figcaption>
        ) : null}
      </Reveal>
    </section>
  )
}
