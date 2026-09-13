# MAHARANI

Persistent project memory for the MAHARANI luxury beauty ecommerce platform. Written from the
repository as it exists on 2026-09-13. Update this file whenever architecture, API or deployment
facts change; it is the first document a future developer or agent should read.

---

## Project identity

- **Brand:** MAHARANI, a luxury beauty ecommerce brand. "Maharani" means queen; the tone is
  editorial, composed, Dubai-glamour: black lacquer, warm candlelight, rose gold.
- **Hero product:** the MAHARANI Luxury Makeup Kit, a compact multi-layer makeup box with a black
  leather-look exterior, rose-gold frame and hardware, a built-in LED-illuminated mirror with touch
  on/off, and three pull-out drawers (Layer 01 Lips & Essentials, Layer 02 Complexion, Layer 03 Eyes).
  Approximate size 14.7 × 7.1 × 3.0 cm (5.8 × 2.8 × 1.2 in), roughly three stacked phones.
- **Visual language:** near-black and warm brown-black surfaces, rose gold and champagne accents,
  ivory type, warm LED glow. High-contrast serif for campaign headings, geometric sans for UI.
- **Collaboration system:** the site can present a partner collaboration (wording, partner name,
  logo, disclaimer) purely as CMS content in Wagtail Site settings. It is **OFF by default** and no
  partner is named anywhere in code, metadata or seed data. It is switched on only when approved
  assets are supplied.

## Current status

### DONE
- Django 5.2 + Wagtail 7 + DRF backend with seven apps (`cms`, `catalog`, `cart`, `orders`,
  `customers`, `payments`, `shipping`), PostgreSQL via `DATABASE_URL`, SQLite fallback in dev only.
- Wagtail CMS: `HomePage`, `StandardPage`, `SiteSettings`, 16 StreamField section blocks, custom
  image serialisation, product chooser for blocks, headless page redirects.
- Catalog: `Product` with gallery, features, specifications, drawer layers, optional variants,
  dimensions; Wagtail "Products" admin and Django admin.
- Cart: server-side, token-based (`X-Cart-Token`), stock-validated, price re-sync.
- Models + admin for orders, order items, customers, addresses, payments, shipping methods.
- REST API v1 (site, pages, products, cart, shipping, health) and Wagtail API v2 (pages, images).
- React 19 / Vite 7 frontend: design tokens, responsive header with mobile menu, bag drawer, product
  search overlay, CMS-driven homepage (hero, editorial, features, scroll reveal, layers, LED
  spotlight, details ledger, purchase, brand story, FAQ), product page, CMS standard pages
  ("Our Story"), account placeholder page, 404, loading/error/empty states.
- SEO: page titles, meta description, canonical, OpenGraph, robots, JSON-LD Product schema.
- Accessibility: semantic landmarks, focus-visible styles, focus traps in overlays, accessible
  accordion, alt text from Wagtail, reduced-motion support.
- Responsive layouts verified at 390, 430 and 1280 px.
- Seed command producing development content from the supplied reference collage.
- Production settings that fail loudly without `SECRET_KEY`/`DATABASE_URL`, WhiteNoise static files,
  gunicorn start script, Railway config, Vercel config, environment examples, deployment docs.

### PARTIAL
- **Media storage:** works on local disk / Railway volume; S3-compatible (R2) mode is implemented
  behind environment variables but has not been exercised against a real bucket.
- **Product imagery:** all images are crops of the supplied reference collage (250–330 px wide);
  final photography/renders are outstanding.
- **Search:** simple `icontains` product search over name/short description/SKU (no full-text).
- **Scroll reveal:** stills-only mode is live; `sequence`, `video` and `model` modes exist in the CMS
  as architectural hooks and fall back to the static presentation.
- **Wagtail preview:** page preview shows a placeholder pointing to the frontend, not a live render.

### PHASE 2
- Checkout flow and payment processing (Stripe) writing into `orders`/`payments`.
- Customer accounts (the `/account` route is an honest placeholder).
- Real product assets and layered/sequence media for the reveal.
- Object storage for media in production, analytics, sitemap/robots, Collections model.

### NOT STARTED
- Any payment provider integration, order creation from cart, email notifications, discount codes,
  inventory reservations, multi-currency, internationalisation, tests suite (only Django system
  checks and lint/build exist).

## Architecture

```
Browser
  ↓ HTTPS
Vercel  →  React 19 SPA (Vite build, React Router)
  ↓ fetch JSON (VITE_API_BASE_URL)
Railway →  Django 5.2 + Django REST Framework  (/api/v1/…, /api/v2/…)
              ├─ Wagtail 7 (content: pages, StreamField blocks, images, site settings)
              └─ Django commerce apps (catalog, cart, orders, customers, payments, shipping)
  ↓
Railway PostgreSQL  (DATABASE_URL)
```

Separation of responsibilities:

- **Wagtail = content.** Everything an editor changes (sections, copy, images, navigation, SEO,
  collaboration wording) lives in Wagtail models and is exposed as JSON.
- **Django apps = commerce.** Products, prices, stock, carts, orders, customers, payments and
  shipping are plain Django models with DRF endpoints. Wagtail only provides their admin UI
  (`ModelViewSet`) and a chooser so content blocks can *reference* a product.
- **React = presentation.** No content is hardcoded; the frontend maps block types to section
  components and renders API data. The Django host redirects page URLs to the frontend.

## Directory map

```
backend/
  manage.py, requirements.txt, start.sh, Procfile, railway.json, .env.example, .python-version
  config/
    settings/base.py         shared settings, env parsing (django-environ), DRF, CORS, Wagtail
    settings/dev.py          DEBUG default True, browsable API, plain static storage
    settings/production.py   fail-fast secrets/DB, HTTPS, HSTS, WhiteNoise, optional S3 media
    urls.py                  /health/, /django-admin/, /admin/, /api/v1/, /api/v2/, media, Wagtail
    api.py                   Wagtail API v2 router (pages, images)
    api_v1.py                v1 URL aggregation + health view
    wsgi.py                  defaults to production settings
  cms/                       content: models (HomePage, StandardPage, SiteSettings), blocks.py,
                             images.py (image JSON shape), api/ (site + pages views),
                             management/commands/seed_maharani.py
  catalog/                   Product + related models, choosers.py, blocks.py (ProductChooserBlock),
                             wagtail_hooks.py (admin viewsets), api/ (serializers, viewset)
  cart/                      Cart, CartItem, api/ (token cart endpoints)
  orders/ customers/ payments/   models + admin only
  shipping/                  ShippingMethod + api/
  seed/maharani-campaign.jpg reference collage used by the seed command
frontend/
  index.html, vite.config.js, vercel.json, eslint.config.js, package.json, .env.example
  src/main.jsx               providers (Router, MotionConfig, SiteProvider, CartProvider)
  src/App.jsx                routes: /, /products/:slug, /account, /:slug, *
  src/api/client.js          fetch wrapper, API_BASE_URL normalisation, endpoint map
  src/api/useApi.js          data hook with in-memory cache
  src/cart/CartContext.jsx   server cart state, X-Cart-Token persistence
  src/site/SiteContext.jsx   site settings state
  src/components/blocks/     one component per StreamField block + BlockRenderer
  src/components/layout/     Header, MobileMenu, BagDrawer, SearchOverlay, Footer, Layout
  src/components/ui/         Button/SmartLink, Heading, Picture, Reveal, Icon, Accordion, …
  src/components/product/    PurchasePanel (shared by home purchase section and product page)
  src/components/seo/Seo.jsx head tags (React 19 hoisting)
  src/lib/                   format, heading parser, motion presets, jsonld, motionPreference
  src/pages/                 HomePage, ProductPage, StandardPage, AccountPage, NotFoundPage
  src/styles/                tokens, base, typography, ui, header, footer, sections, reveal, product
docs/
  second-brain/              this file + maharani.json
  graphify/                  knowledge graph JSON + Mermaid diagrams
  deployment/                RAILWAY.md, VERCEL.md, CHECKLIST.md
```

## CMS model

| Model | Purpose | Key fields |
| --- | --- | --- |
| `cms.HomePage` | Single home page (site root), `max_count = 1` | `body` StreamField, Wagtail `seo_title`/`search_description`, `og_title`, `og_description`, `og_image`, `canonical_url`, `no_index` |
| `cms.StandardPage` | Editorial pages under the home page (e.g. `our-story`) | `intro`, `body` StreamField, same SEO fields |
| `cms.SiteSettings` | Global content (Wagtail → Settings → Site settings) | `brand_name`, `tagline`, announcement bar, `navigation` (links), `featured_product`, collaboration fields (`collaboration_enabled`, `collaboration_label`, `collaboration_partner_name`, `collaboration_logo`, `collaboration_disclaimer`), footer fields, `seo_title_suffix`, `default_meta_description`, `default_og_image` |

Both pages use `HeadlessPageMixin`: Django-side page URLs redirect to `FRONTEND_URL + path`.

### StreamField blocks (`cms/blocks.py`, `PAGE_BLOCKS`)

| `type` | Block class | Notes |
| --- | --- | --- |
| `hero` | `HeroBlock` | title, tagline, headline, body, image, primary/secondary CTA, scroll hint |
| `editorial_text` | `EditorialTextBlock` | eyebrow, heading, rich body, alignment, size |
| `image_text` | `ImageTextBlock` | image left/right + copy + CTA |
| `video` | `VideoBlock` | self-hosted URL or embed, poster, autoplay/loop |
| `product_reveal` | `ProductRevealBlock` | scroll-driven stages; `media_mode` stills/sequence/video/model |
| `features` | `FeatureBlock` | icon items, row or grid layout |
| `drawer_showcase` | `DrawerShowcaseBlock` | layers from product (default) or custom |
| `spotlight` | `SpotlightBlock` | dark glow section (LED mirror), highlights |
| `product_details` | `ProductDetailsBlock` | specs/dimensions/materials from product + extra items |
| `product_purchase` | `ProductPurchaseBlock` | embeds full product JSON, shipping toggle, note |
| `gallery` | `GalleryBlock` | mosaic or strip |
| `quote` | `QuoteBlock` | quote, attribution, role |
| `reviews` | `ReviewBlock` | quote/author/location/rating items |
| `brand_story` | `BrandStoryBlock` | words (Beauty • Elegance • You), heading, body, image, CTA |
| `cta_section` | `CTASectionBlock` | heading, body, CTAs, background image |
| `faq` | `FAQBlock` | question/answer items |

Every section block extends `SectionBlock` (optional `anchor_id`). Shared primitives: `ImageBlock`
(image + alt override → flattened image JSON), `LinkBlock` (page or URL → `{label, href, style,
external}`), `RichText` (bold/italic/link/lists). Heading convention: line breaks = new lines,
`_underscored_` = italic serif.

### How React renders blocks

`GET /api/v1/pages/home/` returns `body: [{type, id, value}]`. `frontend/src/components/blocks/
BlockRenderer.jsx` holds a `BLOCKS` map from `type` to component (`hero → Hero`, `faq → FAQ`, …)
and renders them in the editor-defined order, spreading `value` as props. Unknown types are
skipped (with a dev warning). Adding a block = one Wagtail block + one entry in the map.

## Commerce model

| Model | App | Fields / notes |
| --- | --- | --- |
| `Product` | catalog | `name`, `slug`, `product_type` (single/bundle/limited_edition/collaboration), `collaboration_label`, `short_description`, `description` (rich text), `price`, `compare_at_price`, `currency`, `sku`, `stock_quantity`, `low_stock_threshold`, `is_active`, `is_featured`, `primary_image` (Wagtail image), `height_cm`/`width_cm`/`depth_cm`, `weight_grams`, `dimensions_note`, `materials`, `shipping_information` (rich text). Derived: `in_stock`, `is_low_stock`, `is_on_sale`, `dimensions` (cm + inches). `ClusterableModel` so inlines edit in Wagtail. |
| `ProductImage` | catalog | gallery: `image`, `alt_text`, `caption`, `sort_order` |
| `ProductFeature` | catalog | `icon` (mirror/touch/drawers/leather/travel/size/crown/sparkle), `title`, `description` |
| `ProductSpecification` | catalog | `label`, `value` |
| `ProductLayer` | catalog | drawer: `number`, `name`, `title`, `description`, `contents` (one per line → `items`), `image` |
| `ProductVariant` | catalog | light variants: `name`, `sku`, optional `price`, `stock_quantity`, `is_active`; `effective_price` |
| `Cart` | cart | `token` (UUID), optional `customer`, `currency`, `status` (active/converted/abandoned) |
| `CartItem` | cart | `cart`, `product`, optional `variant`, `quantity`, `unit_price` snapshot; unique per (cart, product, variant) |
| `Order` | orders | `number` (MHR-XXXXXXXX), `status` (pending/paid/fulfilled/cancelled/refunded), `customer`, `cart`, `email`, `phone`, totals, `shipping_method`, shipping address fields, `notes` |
| `OrderItem` | orders | product/variant refs plus snapshots: `product_name`, `sku`, `unit_price`, `quantity` |
| `Customer` | customers | optional `user`, `email` (unique), names, `phone`, `accepts_marketing` |
| `Address` | customers | customer addresses, `is_default` |
| `Payment` | payments | `order`, `provider` (stripe/manual), `status`, `amount`, `currency`, `provider_reference`, `raw_response` — records only, no processing |
| `ShippingMethod` | shipping | `name`, `description`, `price`, `currency`, `estimated_min_days`/`max_days`, `countries` (CSV ISO codes, empty = worldwide), `is_active`, `sort_order` |

## API map

All v1 endpoints are public (`AllowAny`), JSON only in production, anon-throttled
(`API_ANON_THROTTLE`, default 600/min). Session auth is enabled only for Wagtail/Django admin.

| Method | Endpoint | Purpose | Auth / token |
| --- | --- | --- | --- |
| GET | `/health/` | Railway health check, `{"status":"ok"}`, no DB access | none |
| GET | `/api/v1/health/` | same health view under the API prefix | none |
| GET | `/api/v1/site/` | header navigation, announcement, featured product, collaboration, footer, SEO defaults, currency | none |
| GET | `/api/v1/pages/home/` | site root page: `id, type, title, slug, path, seo{…}, body[]` | none |
| GET | `/api/v1/pages/<slug>/` | any live public page by slug (e.g. `our-story`) | none |
| GET | `/api/v1/products/` | active products, paginated (`limit`/`offset`), filters `?featured=1`, `?q=<term>` | none |
| GET | `/api/v1/products/<slug>/` | product detail incl. gallery, features, specifications, layers, variants, dimensions, availability | none |
| GET | `/api/v1/shipping/methods/` | active shipping methods, optional `?country=AE` | none |
| GET | `/api/v1/cart/` | current cart or empty shape | `X-Cart-Token` header (optional) |
| DELETE | `/api/v1/cart/` | empty the cart | `X-Cart-Token` |
| POST | `/api/v1/cart/items/` | `{product: <slug>, quantity, variant_id?}`; creates cart if needed; 201 on new line | `X-Cart-Token` (optional); response sets it |
| PATCH | `/api/v1/cart/items/<id>/` | `{quantity}` (0 removes; max 10; clamped to stock with 400 on overflow) | `X-Cart-Token` required |
| DELETE | `/api/v1/cart/items/<id>/` | remove a line | `X-Cart-Token` required |
| GET | `/api/v2/pages/`, `/api/v2/pages/<id>/` | standard Wagtail API v2 | none |
| GET | `/api/v2/images/` | Wagtail images API | none |
| — | `/admin/` | Wagtail admin | Django session login |
| — | `/django-admin/` | Django admin | Django session login |
| GET | `/media/<path>` | uploaded media when stored locally / on a volume | none |

Response conventions: images `{id, title, alt, width, height, aspect_ratio, focal_point, src,
srcset[], sizes{thumb, medium, large}}` (never upscaled, absolute URLs built from the request);
links `{label, href, style, external}`; availability `{status, label, quantity}` with status in
`in_stock | low_stock | sold_out | unavailable`.

## Cart architecture

1. The frontend keeps no cart state of its own except an opaque token in
   `localStorage["maharani.cart.token"]` (`frontend/src/cart/CartContext.jsx`).
2. Every cart request sends `X-Cart-Token: <uuid>` when a token exists. `cart/api/views.py`
   resolves it to an **active** `Cart`; invalid or unknown tokens simply yield the empty cart.
3. `POST /cart/items/` creates a cart on demand; the new token is returned both in the JSON body
   (`token`) and the `X-Cart-Token` response header (exposed via `CORS_EXPOSE_HEADERS`). The
   frontend stores whichever it receives.
4. Quantities are validated against product/variant stock and capped at 10 per line; `unit_price`
   is snapshotted on add and re-synced to the catalog on every read.
5. Because the identifier is a header rather than a cookie, the cart works across origins
   (Vercel → Railway) without third-party-cookie or SameSite issues. Carts are not tied to users yet;
   `Cart.customer` exists for Phase 2.
6. UI: `PurchasePanel` → `cart.addItem` → drawer opens (`BagDrawer.jsx`) showing lines, stepper,
   remove, subtotal and a disabled "Checkout — coming soon" button. No payment logic exists.

## Design system

Defined in `frontend/src/styles/`:

- `tokens.css` — palette and scale: `--background #0a0807` (black lacquer), `--surface #17110e`
  (warm black), `--accent #c9a07e` (rose gold), `--accent-light #e9cfb4` (champagne),
  `--accent-deep #9c6b4c` (bronze), `--ivory #f8f2e9`, `--glow #ffd9a6` (LED warmth), text
  `#f3eadf` / muted `#ab9f92`; fonts `--serif` Cormorant Garamond (campaign headings, italic
  accents), `--display` Cinzel (wordmark, MAHARANI title), `--sans` Jost (UI, body); layout
  (`--container 1440px`, fluid `--gutter`, `--header-h`), easing/duration tokens.
- `base.css` — reset, focus-visible outline, skip link, `.container`/`.section` helpers,
  `html.reduce-motion` rules (set from `prefers-reduced-motion` in `lib/motionPreference.js`).
- `typography.css` — `.eyebrow`, `.display-xl`, `.display`, `.h2`, `.h3`, `.wordmark`, `.prose`,
  masked line-reveal classes.
- `ui.css` — buttons (primary rose-gold fill, secondary outline, text link), icons, quantity
  stepper, price, availability dot, accordion, skeleton/state blocks, feature tile.
- `header.css`, `footer.css` — fixed transparent header that becomes a dark blurred surface on
  scroll, overlays (mobile menu, bag drawer, search).
- `sections.css`, `reveal.css`, `product.css` — homepage sections, scroll reveal, product page.

Motion (Framer Motion, `lib/motion.js`): slow fade/rise reveals, masked heading lines, clip-path
image reveals, hero parallax, scroll-scrubbed stage crossfades, glow that switches on in view. No
bouncing, no floating decorations, minimal blur. `MotionConfig reducedMotion="user"` plus explicit
static fallbacks respect reduced-motion users.

## Important technical decisions

| Decision | Why | Do not casually reverse because… |
| --- | --- | --- |
| Django + Wagtail for the backend | Mature admin, StreamField gives editors reorderable sections, image renditions, permissions, revisions | The client must edit the site without React changes; the block system is the contract |
| React (Vite) headless frontend, not Wagtail templates | Cinematic motion, SPA interactions (bag drawer, search), independent deploy cadence on Vercel | All pages and SEO are built around API JSON; templates would duplicate presentation |
| Django REST Framework for the project API | Serializers give a stable, explicit JSON contract; throttling, pagination, browsable API in dev | The frontend depends on the documented shapes above |
| StreamField with typed blocks | Predictable `{type, value}` per section so React can map components; editors reorder freely | Ad-hoc rich text would make the frontend unmaintainable |
| Commerce as plain Django apps (not Wagtail pages/snippets) | Products, carts and orders are transactional data, not content; Wagtail only supplies admin UI via `ModelViewSet` + chooser | Mixing content and commerce would couple pricing/stock to page revisions |
| Server-side cart with `X-Cart-Token` | Stock validation and price authority live on the server; works cross-origin without cookies; converts cleanly to an order later | A client-only cart cannot be trusted for checkout |
| Vercel for the frontend | Static SPA hosting, CDN, previews; `vercel.json` SPA rewrite | Server rendering is not needed for the current SEO approach |
| Railway for backend + PostgreSQL | Simple Python service + managed Postgres, injected `DATABASE_URL`, volumes for MVP media | `start.sh`/`railway.json` are tuned for it |
| PostgreSQL in production, SQLite only in dev | Production settings refuse to start without a `postgres://` `DATABASE_URL` | SQLite on an ephemeral filesystem would silently lose data |
| Collaboration as configurable content, OFF by default | Trademark/approval: no partner names or logos in code, metadata or seed | Legal exposure |
| Custom CSS design system, no UI library | The luxury look depends on bespoke type, spacing and motion | A component library would flatten the brand |
| No checkout/payment code yet | Avoid fake payment flows; models are ready for a real provider | Placeholders would mislead users |

## Environment variables

Names only. Never store values in this document.

**BACKEND (Django)**
`DJANGO_SETTINGS_MODULE`, `SECRET_KEY`, `DEBUG` (dev only), `ALLOWED_HOSTS`, `DATABASE_URL`,
`DB_CONN_MAX_AGE`, `TIME_ZONE`, `LOG_LEVEL`, `WAGTAILADMIN_BASE_URL`, `FRONTEND_URL`,
`CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `MEDIA_ROOT`, `SHOP_CURRENCY`, `API_ANON_THROTTLE`,
`SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS`, `SECURE_HSTS_INCLUDE_SUBDOMAINS`,
`SECURE_HSTS_PRELOAD`, `EMAIL_BACKEND`, `DEFAULT_FROM_EMAIL`, optional S3/R2:
`AWS_STORAGE_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_ENDPOINT_URL`,
`AWS_S3_REGION_NAME`, `AWS_S3_CUSTOM_DOMAIN`; dev seed: `DEV_ADMIN_PASSWORD`.

**FRONTEND (Vite, public)**
`VITE_API_BASE_URL`, `VITE_SITE_URL`, `VITE_DEV_API_PROXY` (dev only).

**RAILWAY (backend service)**
Injected: `PORT`, `DATABASE_URL` (via `${{Postgres.DATABASE_URL}}`), `RAILWAY_PUBLIC_DOMAIN`.
Set manually: `DJANGO_SETTINGS_MODULE=config.settings.production`, `SECRET_KEY`, `ALLOWED_HOSTS`,
`WAGTAILADMIN_BASE_URL`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`,
`MEDIA_ROOT` (volume mount path) or the `AWS_*` set; optional `WEB_CONCURRENCY`, `GUNICORN_THREADS`,
`GUNICORN_TIMEOUT`, `GUNICORN_LOG_LEVEL`, `SHOP_CURRENCY`, `LOG_LEVEL`.

**VERCEL (frontend project)**
`VITE_API_BASE_URL`, `VITE_SITE_URL`.

## Development commands

```bash
# Backend (Windows: py -3.12 / .venv\Scripts\python; macOS/Linux: python3 / .venv/bin/python)
cd backend
py -3.12 -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py seed_maharani                 # dev content; prints a generated dev admin password
python manage.py seed_maharani --reset-home    # rebuild the home page body
python manage.py seed_maharani --recrop        # regenerate crops from seed/maharani-campaign.jpg
python manage.py runserver                     # http://localhost:8000
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py makemigrations && python manage.py migrate
python manage.py createsuperuser

# Production-mode checks (safe temporary values, no real DB connection needed)
set DJANGO_SETTINGS_MODULE=config.settings.production
set SECRET_KEY=<any 50+ random chars>
set DATABASE_URL=postgres://user:pass@localhost:5432/maharani
python manage.py check --deploy
python manage.py collectstatic --noinput

# Frontend
cd frontend
npm ci
copy .env.example .env
npm run dev                                    # http://localhost:5173 (proxies /api, /media)
npm run lint
npm run build                                  # → dist/
```

Dev-only QA switch: `?motion=1` forces full motion, `?motion=0` forces reduced motion.

## Deployment

Model produced by this task (details in `docs/deployment/`):

- **GitHub repository** with `frontend/` and `backend/` directories.
- **Vercel project** — root directory `frontend`, framework Vite, `npm run build`, output `dist`,
  `vercel.json` rewrites every non-asset path to `index.html` for React Router, env
  `VITE_API_BASE_URL` + `VITE_SITE_URL`.
- **Railway project** — PostgreSQL service + Django service from `backend/` (Nixpacks, Python 3.12
  from `.python-version`), `railway.json` start command `sh start.sh` (migrate → collectstatic →
  gunicorn), health check `/health/`, volume mounted at `MEDIA_ROOT` for MVP media (or `AWS_*` for
  R2/S3), environment variables as listed above.
- Admin users are created with `python manage.py createsuperuser` in the Railway shell. The seed
  command never creates users when `DEBUG=False`.

## Known constraints

- Current imagery is cropped from the supplied reference collage (1312 px wide source); panels are
  250–330 px and never upscaled by the API. Final high-resolution product photography/renders are
  required before launch.
- Payment/checkout is Phase 2: the bag stores lines but cannot complete an order.
- Customer accounts are Phase 2: `/account` is a placeholder.
- Collaboration wording/logo must be entered only after partner approval; it is off by default.
- Production media: Railway's container filesystem is ephemeral. Use a volume (MVP) or the
  S3/R2 configuration; the latter is implemented but untested against a live bucket.
- Reduced motion: Framer Motion and CSS both honour `prefers-reduced-motion`; headings, hero and the
  scroll reveal render static variants. Developers on reduced-motion machines use `?motion=1`.
- Wagtail live preview is not wired (placeholder page).
- No automated test suite yet; quality gates are `manage.py check`, `makemigrations --check`,
  `check --deploy`, `collectstatic`, ESLint and the Vite build.

## Phase 2

1. Payment provider (Stripe): PaymentIntent flow, webhooks into `payments.Payment`.
2. Checkout: address/contact form, shipping method selection, order creation from cart, emails.
3. Customer accounts: auth, order history, saved addresses (`customers` models exist).
4. Production product assets: photography/renders, transparent layers or WebP sequences for the
   reveal (`media_mode` already in CMS).
5. R2/S3 media storage as the default production mode (config exists; needs bucket + test).
6. Wagtail headless live preview (`wagtail-headless-preview`).
7. Analytics (privacy-respecting) and conversion events.
8. Sitemap and robots endpoints (backend-generated, frontend-served).
9. Collections when the catalog expands (products, bundles, limited editions).

## Deployment runbook

**Symptoms → actions**

- *Railway deploy crash-loops at start:* open deploy logs. `ImproperlyConfigured: DATABASE_URL` →
  attach Postgres and set `DATABASE_URL=${{Postgres.DATABASE_URL}}`. `SECRET_KEY must be set` →
  set a 50+ char secret. `DisallowedHost` → add the Railway domain to `ALLOWED_HOSTS` (the health-check host `healthcheck.railway.app` and `RAILWAY_PUBLIC_DOMAIN` are allowed automatically by `production.py`).
- *Health check failing:* `/health/` must return 200 without DB; if gunicorn is up but health fails,
  check `PORT` binding (start.sh uses `$PORT`) and that `healthcheckPath` is `/health/`.
- *Frontend shows "The store is resting" / network errors:* browser console → CORS. Ensure
  `CORS_ALLOWED_ORIGINS` contains the exact Vercel origin (scheme + host, no trailing slash) and
  `VITE_API_BASE_URL` points at `https://<railway-domain>` (https, or mixed content is blocked).
- *Images broken on the live site:* `WAGTAILADMIN_BASE_URL` must be the public https backend URL
  (absolute media URLs are built from it/request). After a redeploy without a volume, uploads are
  gone: mount a volume at `MEDIA_ROOT` or switch to R2/S3 and re-upload.
- *Wagtail admin unstyled:* `collectstatic` did not run or WhiteNoise manifest is stale → redeploy
  (start.sh runs collectstatic on every boot).
- *CSRF failures in admin:* add `https://<railway-domain>` to `CSRF_TRUSTED_ORIGINS`.
- *Home page 404 in API:* publish the home page in Wagtail or run `python manage.py seed_maharani`
  once from the Railway shell (creates content only; no users in production).
- *Rollback:* Railway → Deployments → redeploy the previous successful build; Vercel → Deployments →
  promote the previous deployment. Migrations are additive so far; no destructive migrations exist.
- *Secret rotation:* change `SECRET_KEY` in Railway (invalidates sessions), rotate DB credentials in
  the Postgres service, redeploy.
