# MAHARANI deployment overview

```
GitHub repository
 ├── frontend/  →  Vercel        (React SPA, Vite build, dist/, SPA rewrite)
 └── backend/   →  Railway       (Django + Wagtail + DRF, gunicorn, /health/)
                     └── Railway PostgreSQL   (DATABASE_URL)
                     └── volume or R2/S3      (media)
```

Frontend talks to the backend over HTTPS using `VITE_API_BASE_URL`; the backend allows only the
frontend origin via `CORS_ALLOWED_ORIGINS`.

Detailed guides:

- [docs/deployment/RAILWAY.md](docs/deployment/RAILWAY.md) — backend + PostgreSQL step by step
- [docs/deployment/VERCEL.md](docs/deployment/VERCEL.md) — frontend step by step
- [docs/deployment/CHECKLIST.md](docs/deployment/CHECKLIST.md) — go-live checklist
- [docs/second-brain/MAHARANI.md](docs/second-brain/MAHARANI.md) — project memory and runbook
- [docs/graphify/architecture.mmd](docs/graphify/architecture.mmd) — architecture diagram
