import { useCart } from '../cart/CartContext.jsx'
import Seo from '../components/seo/Seo.jsx'
import Button from '../components/ui/Button.jsx'
import { useSite } from '../site/SiteContext.jsx'

/**
 * Customer accounts arrive in Phase 2 with checkout. This page keeps the
 * header link honest instead of dead.
 */
export default function AccountPage() {
  const { site } = useSite()
  const cart = useCart()
  return (
    <section className="state">
      <Seo seo={{ title: 'Account', full_title: `Account${site.seo.title_suffix}`, description: 'Your MAHARANI account.', no_index: true }} />
      <p className="eyebrow eyebrow--plain">Account</p>
      <h1 className="state__title">Your account is on its way.</h1>
      <p className="state__text">
        Sign-in, order history and saved details arrive with checkout in the next release. Your bag is kept on this device in the meantime.
      </p>
      <div className="state__actions">
        <Button variant="primary" onClick={cart.open}>
          View bag ({cart.cart.item_count})
        </Button>
        {site.featured_product ? (
          <Button variant="secondary" href={site.featured_product.url}>
            Shop the box
          </Button>
        ) : null}
      </div>
    </section>
  )
}
