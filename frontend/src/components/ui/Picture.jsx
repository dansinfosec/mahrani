/**
 * Renders an API image object (see backend cms/images.py) as a responsive
 * <img> with srcset, intrinsic dimensions (no layout shift) and alt text.
 */
export default function Picture({
  image,
  sizes = '100vw',
  priority = false,
  className,
  alt,
  style,
  decorative = false,
}) {
  if (!image) return null
  const srcSet = image.srcset?.map((entry) => `${entry.url} ${entry.width}w`).join(', ')
  const altText = decorative ? '' : alt ?? image.alt ?? ''

  return (
    <img
      src={image.sizes?.large || image.src}
      srcSet={srcSet || undefined}
      sizes={srcSet ? sizes : undefined}
      width={image.width}
      height={image.height}
      alt={altText}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      className={className}
      style={style}
    />
  )
}
