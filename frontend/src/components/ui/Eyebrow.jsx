import { classNames } from '../../lib/format.js'

/**
 * Tracked label. `chapter` prefixes an editorial campaign number ("01"),
 * `dash` adds the leading rule for the few places that want the motif.
 */
export default function Eyebrow({ children, chapter, dash = false, className, as: Tag = 'p' }) {
  if (!children && !chapter) return null
  return (
    <Tag className={classNames('eyebrow', dash && 'eyebrow--dash', chapter && 'eyebrow--chapter', className)}>
      {chapter ? (
        <span className="eyebrow__chapter">
          <span className="sr-only">Chapter </span>
          {chapter}
        </span>
      ) : null}
      {children}
    </Tag>
  )
}
