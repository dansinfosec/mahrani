import BrandStory from './BrandStory.jsx'
import CTASection from './CTASection.jsx'
import DrawerShowcase from './DrawerShowcase.jsx'
import EditorialText from './EditorialText.jsx'
import FAQ from './FAQ.jsx'
import Features from './Features.jsx'
import Gallery from './Gallery.jsx'
import Hero from './Hero.jsx'
import ImageText from './ImageText.jsx'
import ProductDetails from './ProductDetails.jsx'
import ProductPurchase from './ProductPurchase.jsx'
import ProductReveal from './ProductReveal.jsx'
import Quote from './Quote.jsx'
import Reviews from './Reviews.jsx'
import Spotlight from './Spotlight.jsx'
import Video from './Video.jsx'

/**
 * Maps Wagtail StreamField block types to section components. Adding a block
 * in the CMS means adding one entry here; ordering is entirely editor-driven.
 */
const BLOCKS = {
  hero: Hero,
  editorial_text: EditorialText,
  image_text: ImageText,
  video: Video,
  product_reveal: ProductReveal,
  features: Features,
  drawer_showcase: DrawerShowcase,
  spotlight: Spotlight,
  product_details: ProductDetails,
  product_purchase: ProductPurchase,
  gallery: Gallery,
  quote: Quote,
  reviews: Reviews,
  brand_story: BrandStory,
  cta_section: CTASection,
  faq: FAQ,
}

export default function BlockRenderer({ blocks = [] }) {
  return blocks.map((block, index) => {
    const Component = BLOCKS[block.type]
    if (!Component) {
      if (import.meta.env.DEV) console.warn(`No renderer for block type "${block.type}"`)
      return null
    }
    return <Component key={block.id || index} {...block.value} index={index} />
  })
}
