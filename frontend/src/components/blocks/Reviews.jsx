import Eyebrow from '../ui/Eyebrow.jsx'
import Heading from '../ui/Heading.jsx'
import Icon from '../ui/Icon.jsx'
import Reveal from '../ui/Reveal.jsx'

export default function Reviews({ anchor_id, eyebrow, heading, reviews = [] }) {
  if (!reviews.length) return null
  return (
    <section className="section" id={anchor_id || undefined}>
      <div className="container">
        <div className="reviews__head">
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading as="h2" text={heading} className="h2" />
        </div>
        <ul className="reviews__grid">
          {reviews.map((review, index) => (
            <Reveal as="li" key={index} className="review" delay={index * 0.08}>
              <span className="review__stars" aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Icon key={i} name="star" />
                ))}
              </span>
              <blockquote className="review__quote">“{review.quote}”</blockquote>
              <p className="review__author">
                {review.author}
                {review.location ? `, ${review.location}` : ''}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
