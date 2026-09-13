# Deploying the MAHARANI frontend to Vercel

The frontend is a static React single-page app built by Vite. Vercel serves `frontend/dist/` from
its CDN; every non-asset path is rewritten to `index.html` so React Router handles deep links.

Repository files involved:

| File | Role |
| --- | --- |
| `frontend/vercel.json` | framework `vite`, build `npm run build`, output `dist`, SPA rewrite `/((?!assets/).*) → /index.html`, long cache for `/assets/*`, basic security headers |
| `frontend/package.json` / `package-lock.json` | `npm ci` installs exact versions; scripts `build`, `lint`, `dev` |
| `frontend/.env.example` | names of the public `VITE_*` variables |
| `frontend/src/api/client.js` | reads `VITE_API_BASE_URL`, strips trailing slashes and `/api/v1`, prefixes `/api/v1` |

## Step by step

1. **Import the Git repository.** Vercel dashboard → Add New → Project → Import the GitHub repo.
2. **Set the root directory.** In the import screen → Root Directory → **`frontend`**. (Project →
   Settings → General → Root Directory if the project already exists.)
3. **Framework detection.** Vercel detects **Vite** (also declared in `vercel.json`). Build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci` (default `npm install` also works; `npm ci` is deterministic)
4. **Node version.** Node 20 or 22 (Vercel default) is fine; the project builds with Node 24 locally.
5. **Add environment variables** (Project → Settings → Environment Variables, for Production and
   Preview):
   - `VITE_API_BASE_URL` = `https://<your-backend>.up.railway.app` (https, no trailing slash)
   - `VITE_SITE_URL` = `https://<your-vercel-domain>` (later: the custom domain)
   These are public values compiled into the bundle. Never add Django secrets, database URLs or
   API keys as `VITE_*` variables.
6. **Deploy.** Click Deploy (or push to the production branch). Build output should end with
   `✓ built in …` and list `dist/index.html` plus hashed `dist/assets/*`.
7. **Verify SPA routes.** Open the deployment and hard-refresh each of:
   `/`, `/products/maharani-luxury-makeup-kit`, `/our-story/`, `/account`, `/does-not-exist`.
   None may return a Vercel 404 page; the last one shows the site's own 404 state.
   Static assets must still resolve (`/assets/*.js` returns JavaScript, not HTML).
8. **Verify the API connection.** DevTools → Network: requests go to
   `https://<railway-host>/api/v1/site/` and `/api/v1/pages/home/` with status 200 and an
   `Access-Control-Allow-Origin` header equal to the Vercel origin. If the page shows
   "The store is resting", fix `CORS_ALLOWED_ORIGINS` on Railway or `VITE_API_BASE_URL` here.
   Add to bag must return 201 and the bag drawer should open.
9. **Add a custom domain when ready.** Project → Settings → Domains → add `www.yourdomain.com`
   (and apex redirect). Then update `VITE_SITE_URL` here and, on Railway, `FRONTEND_URL` and
   `CORS_ALLOWED_ORIGINS` (add the new origin), and redeploy both.

## Notes

- Preview deployments get random `*.vercel.app` origins; either add them to `CORS_ALLOWED_ORIGINS`
  temporarily or test previews against a staging backend.
- Because the app is fully static, Vercel serverless functions are not used.
- A 404 for a real route after deploy almost always means the root directory is not `frontend` or
  `vercel.json` was not picked up.
