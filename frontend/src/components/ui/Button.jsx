import { Link } from 'react-router-dom'

import { classNames } from '../../lib/format.js'

/**
 * Renders the right element for a CMS link `{label, href, style}` or plain
 * props. Internal paths use the router, anchors scroll, everything else is a
 * normal <a>.
 */
export function SmartLink({ href = '#', children, className, onClick, ...rest }) {
  const isHash = href.startsWith('#')
  const isInternal = href.startsWith('/') && !href.startsWith('//')

  if (isHash) {
    return (
      <a
        href={href}
        className={className}
        onClick={(event) => {
          const target = document.getElementById(href.slice(1))
          if (target) {
            event.preventDefault()
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
            window.history.replaceState(null, '', href)
          }
          onClick?.(event)
        }}
        {...rest}
      >
        {children}
      </a>
    )
  }

  if (isInternal) {
    return (
      <Link to={href} className={className} onClick={onClick} {...rest}>
        {children}
      </Link>
    )
  }

  const external = /^https?:/i.test(href)
  return (
    <a
      href={href}
      className={className}
      onClick={onClick}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
      {...rest}
    >
      {children}
    </a>
  )
}

export default function Button({
  as,
  href,
  variant = 'primary',
  size,
  block = false,
  className,
  children,
  ...rest
}) {
  const classes = classNames(
    'btn',
    `btn--${variant}`,
    size === 'lg' && 'btn--lg',
    block && 'btn--block',
    className,
  )
  if (href || as === 'link') {
    return (
      <SmartLink href={href} className={classes} {...rest}>
        {children}
      </SmartLink>
    )
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}

/** Button from a CMS link object; renders nothing when the link is empty. */
export function CmsButton({ link, variant, ...rest }) {
  if (!link || !link.label) return null
  return (
    <Button href={link.href} variant={variant || link.style || 'primary'} {...rest}>
      {link.label}
    </Button>
  )
}
