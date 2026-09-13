/** schema.org Product structured data from an API product. */
export function productJsonLd(product, { brand = 'MAHARANI', url } = {}) {
  if (!product) return null
  const availabilityMap = {
    in_stock: 'https://schema.org/InStock',
    low_stock: 'https://schema.org/LimitedAvailability',
    sold_out: 'https://schema.org/OutOfStock',
    unavailable: 'https://schema.org/Discontinued',
  }
  const images = [product.primary_image, ...(product.gallery?.map((g) => g.image) || [])]
    .filter(Boolean)
    .map((image) => image.src)

  const dimension = (value) =>
    value ? { '@type': 'QuantitativeValue', value: value.cm, unitCode: 'CMT' } : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description,
    sku: product.sku,
    image: images,
    brand: { '@type': 'Brand', name: brand },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: product.currency,
      price: product.price,
      availability: availabilityMap[product.availability?.status] || 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.dimensions
      ? {
          height: dimension(product.dimensions.height),
          width: dimension(product.dimensions.width),
          depth: dimension(product.dimensions.depth),
        }
      : {}),
  }
}
