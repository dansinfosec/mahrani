import { classNames } from '../../lib/format.js'

/**
 * Wagtail rich text arrives as sanitised HTML limited to the features
 * configured on the block (bold, italic, link, lists).
 */
export default function RichText({ html, className, as: Tag = 'div' }) {
  if (!html) return null
  return <Tag className={classNames('prose', className)} dangerouslySetInnerHTML={{ __html: html }} />
}
