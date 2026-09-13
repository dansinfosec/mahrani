# Deploying the MAHARANI backend to Railway

Target topology:

```
Railway project "maharani"
 ├── Postgres            (managed PostgreSQL, provides DATABASE_URL)
 └── backend (web)       (Django + Wagtail + DRF, root directory: backend/)
       └── volume mounted at /app/media   (MVP media; or use R2/S3 instead)
```

What the repository already provides:

| File | Role |
| --- | --- |
| `backend/railway.json` | Nixpacks build, start command `sh start.sh`, health check `/health/`, restart policy |
| `backend/start.sh` | `migrate --noinput` → `collectstatic --noinput` → `gunicorn config.wsgi:application` bound to `$PORT` |
| `backend/Procfile` | `web: sh start.sh` (same command, for tooling that reads Procfiles) |
| `backend/.python-version` | Python 3.12 |
| `backend/requirements.txt` | pinned dependency ranges incl. `psycopg[binary]`, `gunicorn`, `whitenoise`, `django-storages[s3]` |
| `backend/config/settings/production.py` | fails fast without `SECRET_KEY`/`DATABASE_URL`, forces `DEBUG=False`, HTTPS/HSTS, WhiteNoise, optional S3 media |

## Current production state (2026-09-13)

- Project `maharani` → services `backend` (https://backend-production-0805.up.railway.app, region ams) and `Postgres`.
- Volume `media` mounted at `/app/media`; variables set as in the checklist below; GitHub `dansinfosec/mahrani` `main` auto-deploys.
- Shell commands run through the CLI: `railway ssh --service backend -- /opt/venv/bin/python manage.py <command>`
  (the SSH shell does not activate the Nixpacks virtualenv; on Windows Git Bash prefix with `MSYS_NO_PATHCONV=1`).

## Step by step

1. **Create the Railway project.** Railway dashboard → New Project → Empty project. Name it (e.g. `maharani`).
2. **Add PostgreSQL.** + New → Database → PostgreSQL. Wait until it is running. Railway now exposes
   `DATABASE_URL` on that service (`${{Postgres.DATABASE_URL}}` when referenced from other services).
3. **Add the backend service from GitHub.** + New → GitHub Repo → select the repository. Railway will
   create a service; open it.
4. **Set the root directory.** Service → Settings → Source → **Root Directory: `backend`**. Nixpacks
   will then detect `requirements.txt` and `.python-version`, and read `railway.json` from that
   directory. Watch paths (optional): `backend/**`.
5. **Configure environment variables.** Service → Variables. Use the checklist below. Reference the
   database with the variable reference syntax so credentials are never copied by hand:
   `DATABASE_URL = ${{Postgres.DATABASE_URL}}`.
6. **Generate the public domain.** Service → Settings → Networking → Generate Domain
   (e.g. `maharani-api.up.railway.app`). Put that host into `ALLOWED_HOSTS`, and
   `https://<host>` into `WAGTAILADMIN_BASE_URL` and `CSRF_TRUSTED_ORIGINS`.
7. **Add a volume for media (MVP).** Service → + Volume → mount path `/app/media`, then set
   `MEDIA_ROOT=/app/media`. Skip this if you configure R2/S3 (see "Media" below).
8. **Deploy.** Railway deploys on push; trigger a deploy if needed. Watch the build log (pip install)
   and the deploy log: you should see `Applying … OK` migration lines, `N static files copied`, then
   gunicorn `Listening at: http://0.0.0.0:<port>`.
9. **Confirm migrations.** Deploy log shows migrations, or run in the service shell:
   `python manage.py showmigrations | grep "\[ \]"` (should print nothing).
10. **Confirm the health endpoint.** `curl -i https://<host>/health/` → `200 {"status":"ok"}`.
    Railway's own health check uses the same path (see `railway.json`).
11. **Create the production superuser.** Service → Shell, or from the CLI:
    `railway ssh --service backend -- /opt/venv/bin/python manage.py createsuperuser`. There are no default credentials anywhere; the development
    seed never creates users when `DEBUG=False`.
12. **Open the Wagtail admin.** `https://<host>/admin/` → log in. Static assets must load (WhiteNoise).
13. **Add content.** Either build the home page by hand (Pages → add Home page, set it as the Site root
    under Settings → Sites, fill Site settings), or bootstrap the development content once:
    `python manage.py seed_maharani` (creates images, the product, home page, Our Story and site
    settings; it does **not** create users in production). Then edit copy, prices and images in Wagtail.
    Upload real product photography when available.
14. **Verify CORS.** From the deployed Vercel site, open DevTools → Network → any `/api/v1/…` request:
    response must include `Access-Control-Allow-Origin: https://<vercel-domain>`. If it fails, check
    `CORS_ALLOWED_ORIGINS` (exact scheme + host, comma-separated, no trailing slash).
15. **Verify the API from a browser.** `https://<host>/api/v1/site/`, `/api/v1/pages/home/`,
    `/api/v1/products/` should return JSON (production disables the browsable API).

## Environment variable checklist (backend service)

Names only. Generate `SECRET_KEY` with `python -c "import secrets; print(secrets.token_urlsafe(64))"`.

| Variable | Required | Value shape |
| --- | --- | --- |
| `DJANGO_SETTINGS_MODULE` | yes | `config.settings.production` |
| `SECRET_KEY` | yes | 50+ random characters (production rejects short/default keys) |
| `DATABASE_URL` | yes | `${{Postgres.DATABASE_URL}}` (must be `postgres://`; SQLite is refused) |
| `ALLOWED_HOSTS` | yes | `maharani-api.up.railway.app,api.yourdomain.com` (production settings also allow `healthcheck.railway.app` and the injected `RAILWAY_PUBLIC_DOMAIN` automatically) |
| `WAGTAILADMIN_BASE_URL` | yes | `https://maharani-api.up.railway.app` |
| `FRONTEND_URL` | yes | `https://your-site.vercel.app` (or custom domain) |
| `CORS_ALLOWED_ORIGINS` | yes | `https://your-site.vercel.app,https://www.yourdomain.com` |
| `CSRF_TRUSTED_ORIGINS` | yes | `https://maharani-api.up.railway.app,https://api.yourdomain.com` |
| `MEDIA_ROOT` | volume mode | `/app/media` (volume mount path) |
| `AWS_STORAGE_BUCKET_NAME` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_S3_ENDPOINT_URL` + `AWS_S3_REGION_NAME` + `AWS_S3_CUSTOM_DOMAIN` | R2/S3 mode | see Media |
| `SHOP_CURRENCY` | no | `USD` (default) |
| `LOG_LEVEL` | no | `INFO` |
| `SECURE_SSL_REDIRECT` | no | `True` (default) |
| `SECURE_HSTS_SECONDS` | no | `2592000` default; raise once the domain is final |
| `SECURE_HSTS_PRELOAD` | no | `False` default |
| `WEB_CONCURRENCY` / `GUNICORN_THREADS` / `GUNICORN_TIMEOUT` | no | `2` / `2` / `120` defaults |
| `EMAIL_BACKEND`, `DEFAULT_FROM_EMAIL` | no | console backend by default |

Injected by Railway: `PORT`, `RAILWAY_PUBLIC_DOMAIN`, `RAILWAY_ENVIRONMENT`.

## Media

Railway's container filesystem is **ephemeral**: anything written outside a volume disappears on
redeploy. Choose one:

- **A. Volume (MVP, default):** mount a volume at `/app/media`, set `MEDIA_ROOT=/app/media`. Django
  serves `/media/…` itself (fine for an MVP, not a CDN). Back the volume up before schema changes.
- **B. S3-compatible storage (recommended before launch):** create a Cloudflare R2 (or S3) bucket
  with a public custom domain, then set the `AWS_*` variables. When `AWS_STORAGE_BUCKET_NAME` is
  present, `production.py` switches `STORAGES["default"]` to `django-storages` S3 and `MEDIA_URL` to
  the custom domain; the Django `/media/` route is disabled automatically. Re-upload images after
  switching (existing volume files are not migrated).

## Operations

- **Logs:** Service → Deployments → View logs (gunicorn access/error logs go to stdout).
- **Shell:** Service → Shell, or `railway shell` with the CLI.
- **Rollback:** Deployments → previous deployment → Redeploy.
- **Restart:** Service → Restart (safe: start.sh is idempotent).
- **Scaling:** raise `WEB_CONCURRENCY` (workers) with instance memory; DB connections ≈ workers × threads.
