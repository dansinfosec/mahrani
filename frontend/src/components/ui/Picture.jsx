/**
 * Renders an API image object (see backend cms/images.py) as a responsive
 * <img> with srcset, intrinsic dimensions (no layout shift) and alt text.
 *
 * `sources` adds art direction: each entry is `{ image, media, sizes }` and
 * becomes a <source> inside a <picture>, so a portrait crop can serve phones
 * while the landscape master serves desktop.
 */
function buildSrcSet(image) {
  return image?.srcset?.map((entry) => `${entry.url} ${entry.width}w`).join(', ') || undefined
}

export default function Picture({
  image,
  sizes = '100vw',
  priority = false,
  className,
  alt,
  style,
  decorative = false,
  sources = [],
}) {
  if (!image) return null
  const srcSet = buildSrcSet(image)
  const altText = decorative ? '' : alt ?? image.alt ?? ''

  const img = (
    <img
      src={image.sizes?.large || image.src}
      srcSet={srcSet}
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

  const usable = sources.filter((source) => source?.image)
  if (!usable.length) return img

  return (
    <picture>
      {usable.map((source, index) => (
        <source
          key={index}
          media={source.media}
          srcSet={buildSrcSet(source.image) || source.image.sizes?.large || source.image.src}
          sizes={source.sizes}
          width={source.image.width}
          height={source.image.height}
        />
      ))}
      {img}
    </picture>
  )
}
