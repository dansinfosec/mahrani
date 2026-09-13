import { Link } from 'react-router-dom'

import { useSite } from '../../site/SiteContext.jsx'
import Crown from '../brand/Crown.jsx'
import { SmartLink } from '../ui/Button.jsx'

export default function Footer() {
  const { site } = useSite()
  const { footer, collaboration } = site
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <Crown className="footer__crown" />
            <Link to="/" className="wordmark footer__wordmark">
              {site.brand_name}
            </Link>
            {footer.tagline ? <p className="footer__tagline">{footer.tagline}</p> : null}
            {collaboration.enabled ? (
              <p className="caps muted">
                {collaboration.label} {collaboration.partner_name}
              </p>
            ) : null}
          </div>

          <div className="footer__cols">
            <div className="footer__col">
              <span className="caps footer__heading">Explore</span>
              {site.navigation.map((link) => (
                <SmartLink key={link.label} href={link.href} className="footer__link">
                  {link.label}
                </SmartLink>
              ))}
            </div>
            <div className="footer__col">
              <span className="caps footer__heading">Company</span>
              {footer.links.map((link) => (
                <SmartLink key={link.label} href={link.href} className="footer__link">
                  {link.label}
                </SmartLink>
              ))}
              {footer.instagram_url ? (
                <a className="footer__link" href={footer.instagram_url} target="_blank" rel="noreferrer noopener">
                  Instagram
                </a>
              ) : null}
              {footer.tiktok_url ? (
                <a className="footer__link" href={footer.tiktok_url} target="_blank" rel="noreferrer noopener">
                  TikTok
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <span>{footer.copyright_text || `© ${year} ${site.brand_name}`}</span>
          {collaboration.enabled && collaboration.disclaimer ? (
            <span className="footer__disclaimer">{collaboration.disclaimer}</span>
          ) : null}
          <span>{site.tagline}</span>
        </div>
      </div>
    </footer>
  )
}
