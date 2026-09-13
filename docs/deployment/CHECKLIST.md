# MAHARANI go-live checklist

Tick every box before announcing the site. Commands are run from `backend/` or `frontend/`.

## Backend (Railway)

- [ ] `DJANGO_SETTINGS_MODULE=config.settings.production` set on the service
- [ ] `SECRET_KEY` set (50+ random chars, generated, never reused from dev)
- [ ] `DATABASE_URL=${{Postgres.DATABASE_URL}}` connected (postgres, not SQLite)
- [ ] `ALLOWED_HOSTS`, `WAGTAILADMIN_BASE_URL`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` set to final domains
- [ ] Media strategy chosen: volume at `MEDIA_ROOT` **or** R2/S3 `AWS_*` variables
- [ ] `python manage.py check --deploy` passes locally with production settings
- [ ] `python manage.py makemigrations --check --dry-run` reports "No changes detected"
- [ ] Deploy log shows migrations applied (`migrate --noinput`)
- [ ] Deploy log shows `collectstatic` copied files
- [ ] `GET https://<api-host>/health/` → 200 `{"status":"ok"}`
- [ ] Wagtail admin `https://<api-host>/admin/` loads with styles; superuser created via `createsuperuser`
- [ ] Product API `GET /api/v1/products/` and `/api/v1/products/<slug>/` return real data
- [ ] CMS API `GET /api/v1/pages/home/` and `/api/v1/site/` return published content
- [ ] Cart API: `POST /api/v1/cart/items/` → 201 with `X-Cart-Token`; `PATCH`/`DELETE` work
- [ ] CORS header present for the Vercel origin only (no wildcard)
- [ ] CSRF: admin login works over HTTPS (no 403 CSRF errors)

## Frontend (Vercel)

- [ ] `npm ci` succeeds from a clean checkout
- [ ] `npm run lint` passes
- [ ] `npm run build` passes and produces `dist/`
- [ ] Vercel root directory `frontend`, framework Vite, output `dist`
- [ ] `vercel.json` SPA rewrite verified: hard refresh on `/products/<slug>`, `/our-story/`, `/account` → no Vercel 404
- [ ] `VITE_API_BASE_URL` points at the Railway HTTPS domain; `VITE_SITE_URL` at the public site URL
- [ ] Homepage renders all CMS sections, images load from the API host
- [ ] Product page renders gallery, price, availability, shipping methods
- [ ] Bag: add, change quantity, remove, persists after reload (`X-Cart-Token` in localStorage)
- [ ] Mobile check at 390 px and 430 px: header, menu, hero, purchase section, product page
- [ ] Unknown route shows the site 404 state
- [ ] SEO: `<title>`, meta description, canonical, `og:*` tags and Product JSON-LD present in page source

## Security

- [ ] `DEBUG` is False in production (forced by `production.py`)
- [ ] No secrets committed: `.env` files ignored, only `.env.example` in git
- [ ] No development passwords: the seed never creates users when `DEBUG=False`; dev admin uses a generated password
- [ ] HTTPS enforced (`SECURE_SSL_REDIRECT`, HSTS on, secure cookies)
- [ ] `ALLOWED_HOSTS` restricted to real hosts
- [ ] `CORS_ALLOWED_ORIGINS` restricted to the frontend origin(s); `CORS_ALLOW_ALL_ORIGINS` is never set
- [ ] Admin URLs (`/admin/`, `/django-admin/`) reachable only over HTTPS with strong passwords
- [ ] Dependency versions pinned (`requirements.txt`, `package-lock.json`)

## Content (Wagtail)

- [ ] Approved MAHARANI logo/crown uploaded (frontend crown is a placeholder SVG)
- [ ] Collaboration assets approved before enabling `collaboration_enabled` and entering partner name/logo
- [ ] Real product pricing, compare-at price and stock entered on the product
- [ ] Shipping policy written (Site settings/FAQ and `ShippingMethod` records)
- [ ] Returns policy written
- [ ] Privacy policy page published
- [ ] Terms page published
- [ ] Final product photography/renders uploaded and placed (hero, reveal stages, layers, gallery)
- [ ] Alt text reviewed on every image (Wagtail image description)
- [ ] SEO title, description and social image set on each page and in Site settings defaults
