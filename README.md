# MAHARANI — luxury beauty ecommerce

Headless ecommerce scaffold for the MAHARANI Luxury Makeup Kit.

- `backend/` — Django 5.2 + Wagtail 7 (content) + Django REST Framework (API) + PostgreSQL. Deploys to Railway.
- `frontend/` — React 19 + Vite 7 + React Router 7 + Framer Motion. Deploys to Vercel.

Wagtail owns **content** (pages, sections, copy, images, site settings). Django commerce apps own
**commerce** (products, cart, orders, customers, payments, shipping). React owns **presentation**.

---

## Local development

### Backend

```bash
cd backend
py -3.12 -m venv .venv                 # or: python3 -m venv .venv
.venv\Scripts\activate                 # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env                 # macOS/Linux: cp .env.example .env
python manage.py migrate
python manage.py seed_maharani         # images, product, home page, Our Story, settings
python manage.py runserver
```

- API: <http://localhost:8000/api/v1/> (health check at `/api/v1/health/`)
- Wagtail admin: <http://localhost:8000/admin/> — in DEBUG the seed creates a dev user `admin` and prints a generated password (set `DEV_ADMIN_PASSWORD` to choose it). Production admins are created with `python manage.py createsuperuser`.
- Django admin: <http://localhost:8000/django-admin/>

Without `DATABASE_URL` the backend uses a local SQLite file. Set `DATABASE_URL=postgres://…` to use PostgreSQL.

Seed options: `--reset-home` rebuilds the home page sections; `--recrop` regenerates the product crops from
`backend/seed/maharani-campaign.jpg`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev                            # http://localhost:5173 (proxies /api and /media to Django)
npm run lint
npm run build
```

Dev-only motion override for QA: append `?motion=1` to force full motion or `?motion=0` to force the
reduced-motion experience, regardless of the OS setting.

---

## API (v1)

| Endpoint | Purpose |
| --- | --- |
| `GET /api/v1/site/` | Header navigation, footer, announcement, collaboration content, SEO defaults |
| `GET /api/v1/pages/home/` | Home page: SEO fields + ordered StreamField `body` |
| `GET /api/v1/pages/<slug>/` | Any live page (e.g. `our-story`) |
| `GET /api/v1/products/?featured=1&q=` | Active products |
| `GET /api/v1/products/<slug>/` | Product detail: gallery, features, specs, layers, variants, dimensions |
| `GET /api/v1/shipping/methods/?country=AE` | Active shipping methods |
| `GET/DELETE /api/v1/cart/` | Current cart (token in `X-Cart-Token` header) |
| `POST /api/v1/cart/items/` | `{product: <slug>, quantity, variant_id?}` |
| `PATCH/DELETE /api/v1/cart/items/<id>/` | Update quantity (0 removes) / remove |
| `GET /api/v2/pages/`, `/api/v2/images/` | Standard Wagtail API |

Every StreamField block serialises as `{type, id, value}`; every image as
`{id, title, alt, width, height, aspect_ratio, focal_point, src, srcset[], sizes{thumb,medium,large}}`;
every link as `{label, href, style, external}`. The React `BlockRenderer` maps `type` → section component.

### Content model

- `HomePage` and `StandardPage` share one StreamField with these blocks: hero, editorial_text, image_text,
  video, product_reveal, features, drawer_showcase, spotlight (LED mirror), product_details,
  product_purchase, gallery, quote, reviews, brand_story, cta_section, faq. Editors reorder sections freely.
- Blocks that show product data (`drawer_showcase`, `product_details`, `product_purchase`, `product_reveal`)
  reference a catalog Product through a chooser; specs, dimensions, layers and price stay on the product.
- Heading fields: line breaks start new lines, `_underscored_` text renders in italic serif.
- **Site settings** (Wagtail → Settings → Site settings) hold navigation, footer, announcement bar,
  SEO defaults and the collaboration block. Collaboration content is **off by default** and contains no
  partner naming in code; enable it and enter approved names/logos when assets are cleared.

### Commerce model

- `catalog.Product` (+ gallery, features, specifications, layers, optional variants), editable in Wagtail
  under **Products** and in Django admin.
- `cart.Cart` / `CartItem` — server-side, token-identified, stock-validated. Prices re-sync on every read.
- `orders`, `customers`, `payments`, `shipping` — models and admin only. No checkout or payment
  processing exists yet, by design.

---

## Deployment

| Layer | Platform | Notes |
| --- | --- | --- |
| Frontend | **Vercel** | root `frontend`, framework Vite, `npm run build` → `dist/`, SPA rewrite in `frontend/vercel.json` |
| Backend / API / Wagtail | **Railway** | root `backend`, Nixpacks, `sh start.sh` (migrate → collectstatic → gunicorn), health `/health/` |
| Database | **Railway PostgreSQL** | injected `DATABASE_URL`; production refuses to start without it (no SQLite fallback) |
| Media | Railway volume at `MEDIA_ROOT` (MVP) or S3/R2 via `AWS_*` variables | see RAILWAY.md |

Guides and references:

- [docs/deployment/VERCEL.md](docs/deployment/VERCEL.md) — frontend deployment
- [docs/deployment/RAILWAY.md](docs/deployment/RAILWAY.md) — backend + PostgreSQL deployment and env checklist
- [docs/deployment/CHECKLIST.md](docs/deployment/CHECKLIST.md) — go-live checklist
- [DEPLOYMENT.md](DEPLOYMENT.md) — one-screen overview
- [docs/second-brain/MAHARANI.md](docs/second-brain/MAHARANI.md) — project memory, decisions, runbook
- [docs/graphify/architecture.mmd](docs/graphify/architecture.mmd) — architecture diagram (Mermaid); [domain-model.mmd](docs/graphify/domain-model.mmd), [maharani-graph.json](docs/graphify/maharani-graph.json)

Production admin users: `python manage.py createsuperuser` in the Railway shell. The development
seed never creates users when `DEBUG=False`.

---

## Repository layout

```
backend/
  config/            settings (base/dev/production), urls, API routers
  cms/               pages, blocks, site settings, image serialisation, API, seed command
  catalog/           Product + related models, Wagtail chooser/viewset, API
  cart/  orders/  customers/  payments/  shipping/
  seed/              reference campaign image used by seed_maharani
frontend/
  src/api            fetch client + useApi hook
  src/cart           CartProvider (server cart, token in localStorage)
  src/site           SiteProvider (site settings)
  src/components     blocks/ (one per StreamField block), layout/, ui/, product/, seo/
  src/pages          Home, Product, Standard (CMS), Account (placeholder), NotFound
  src/styles         tokens, base, typography, ui, header, footer, sections, reveal, product
```
