import { classNames } from '../../lib/format.js'

/**
 * Tracked label. Plain by default; `dash` adds the leading rule for the few
 * places that want the motif.
 */
export default function Eyebrow({ children, dash = false, className, as: Tag = 'p' }) {
  if (!children) return null
  return <Tag className={classNames('eyebrow', dash && 'eyebrow--dash', className)}>{children}</Tag>
}
