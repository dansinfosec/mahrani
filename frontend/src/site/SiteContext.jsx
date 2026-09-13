/* eslint-disable react-refresh/only-export-components -- provider + hook live together */
import { createContext, useContext } from 'react'

import { endpoints } from '../api/client.js'
import { useApi } from '../api/useApi.js'

const SiteContext = createContext(null)

// Safe defaults used until /api/v1/site/ responds (or if it fails).
const fallbackSite = {
  brand_name: 'MAHARANI',
  tagline: 'Beauty • Elegance • You',
  announcement: { enabled: false, text: '' },
  navigation: [],
  featured_product: null,
  collaboration: { enabled: false, label: '', partner_name: '', logo: null, disclaimer: '' },
  footer: { tagline: '', links: [], instagram_url: '', tiktok_url: '', contact_email: '', copyright_text: '' },
  seo: { title_suffix: ' | MAHARANI', default_description: '', default_og_image: null },
  currency: 'USD',
}

export function SiteProvider({ children }) {
  const { data, error, loading } = useApi(endpoints.site)
  const value = { site: data || fallbackSite, loaded: Boolean(data), error, loading }
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const context = useContext(SiteContext)
  if (!context) throw new Error('useSite must be used inside <SiteProvider>')
  return context
}
