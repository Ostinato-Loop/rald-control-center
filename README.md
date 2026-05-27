# RALD Control Center

Enterprise AI orchestration and infrastructure control plane for the RALD ecosystem.

**Live:** [control.rald.cloud](https://control.rald.cloud)
**API:** [api.control.rald.cloud](https://api.control.rald.cloud)

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite → Cloudflare Pages |
| Backend API | Hono on Cloudflare Workers |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (jose, WebCrypto PBKDF2) |
| CI/CD | GitHub Actions → Cloudflare |
| Domain | RALD.cloud |

## Structure

```
apps/
  api/          # Cloudflare Worker (Hono)
  web/          # React + Vite (Cloudflare Pages)
supabase/
  migrations/   # SQL schema
  seed.sql      # Initial data
.github/
  workflows/    # CI/CD pipelines
```

## Setup

### 1. Supabase
Run `supabase/migrations/001_initial_schema.sql` in your Supabase SQL Editor.
Run `supabase/seed.sql` for initial data.

### 2. Cloudflare Worker Secrets
```bash
cd apps/api
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_KEY
npx wrangler secret put JWT_SECRET
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put N8N_URL
npx wrangler secret put N8N_API_KEY
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put AWS_REGION
```

### 3. Deploy Worker
```bash
cd apps/api && npx wrangler deploy
```

### 4. Cloudflare Pages
Create a Pages project named `rald-control-center` pointing to `apps/web/dist`.
Set build variable: `VITE_API_URL=https://api.control.rald.cloud/api`

### 5. Create Admin User
```bash
curl -X POST https://api.control.rald.cloud/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@rald.cloud","password":"your-secure-password"}'
```

### 6. DNS Records (Cloudflare)
- `control.rald.cloud` → Cloudflare Pages CNAME
- `api.control.rald.cloud` → Worker route (configured in wrangler.toml)

## GitHub Actions Secrets Required
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## Architecture

The entire backend runs on Cloudflare's edge network — zero cold starts, globally distributed, no servers to manage. All secrets are stored as Cloudflare Worker secrets (encrypted at rest). GitHub is the single source of truth; all deployments are triggered from pushes to `main`.
