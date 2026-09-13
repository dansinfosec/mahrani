import { classNames } from '../../lib/format.js'

export default function Eyebrow({ children, plain = false, className, as: Tag = 'p' }) {
  if (!children) return null
  return <Tag className={classNames('eyebrow', plain && 'eyebrow--plain', className)}>{children}</Tag>
}
