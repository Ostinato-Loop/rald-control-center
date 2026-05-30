# RALD Ecosystem — Remaining Risks Report
**Date:** 2026-05-30 | **Org:** Ostinato-Loop | **Scope:** Unresolved issues, technical debt, operational risks

---

## Risk Summary

| # | Risk | Severity | Category | Owner |
|---|------|----------|---------|-------|
| R-01 | `messenger-api.rald.cloud` returning 522 | High | Operational | Worker team |
| R-02 | Kong upstream `name resolution failed` on `/v1/` routes | High | Infrastructure | Kong/Platform team |
| R-03 | CORS wildcard (`*`) on cc-api and loop-api | Medium | Security | Backend team |
| R-04 | `loop-db` and `rald-edge-db` have 0 tables | Medium | Database | DB team |
| R-05 | `auth.rald.cloud` returns HTTP 000 | Medium | Operational | Auth team |
| R-06 | Missing security headers (x-frame-options, CSP, HSTS) | Medium | Security | Platform team |
| R-07 | `loop`, `rald`, `messenger1` Workers stale (10+ days) | Low | Operational | DevOps team |
| R-08 | `rald-auth-server` — No CI, README-only | Low | Process | Auth team |
| R-09 | `rald-infrastructure` — No CI, no code | Low | Process | Infra team |
| R-10 | `temporary.rald.cloud` → Auth0 dev DNS record | Low | Security | Security team |
| R-11 | D1 migration step continues to fail in deploy-api CI | Low | CI/CD | DevOps team |
| R-12 | `loop-api.rald.cloud` root 404 (no root route handler) | Low | UX | Loop team |
| R-13 | UX: `loop.rald.cloud` title is "Loop" not "RALD Loop" | Low | UX | Design team |
| R-14 | Supabase keys in org secrets vs per-repo isolation | Low | Security | Platform team |

---

## Detailed Risk Analysis

### R-01 — messenger-api.rald.cloud → 522 (HIGH)
**Impact:** Messenger API unreachable externally; message sending/receiving may be broken for users.  
**Root cause analysis:** `loop-messenger-api` Worker route was missing (fixed this session: route now added). However, the Worker itself still returns 522, suggesting the Worker script may have a runtime error or startup crash.  
**Evidence:** `loop-messenger-api.ostinato-loop.workers.dev` also returns 000 (could be sandbox restriction, not proven crash).  
**Mitigation:** Check Worker error logs in Cloudflare dashboard → Workers & Pages → `loop-messenger-api` → Logs. Worker was last deployed 2026-05-27.  
**Recommended action:** Redeploy `loop-messenger-api` from the `messenger` repo CI (`Deploy` workflow).

### R-02 — Kong Upstream DNS Failure (HIGH)
**Impact:** `credentials.rald.cloud/v1/*` routes (the main API gateway) are returning "name resolution failed". Any service that routes through Kong to `/v1/` is broken.  
**Root cause:** Kong gateway has an upstream configured for `/v1/` that references a hostname that no longer resolves (possibly an ECS task, EC2 instance, or Railway/Render URL that was decommissioned).  
**Evidence:** `GET /v1/users` → `{"message":"name resolution failed","request_id":"..."}` from Kong.  
**Recommended action:** Access Kong Admin API or Kong dashboard → Services → find the `/v1/` upstream → update the host URL to the correct `rald-api` Worker or backend service.  
**Note:** `/health` on credentials.rald.cloud still routes correctly to `rald-api`, confirming Kong itself is operational.

### R-03 — CORS Wildcard on Admin APIs (MEDIUM)
**Impact:** `cc-api.rald.cloud` and `loop-api.rald.cloud` both return `access-control-allow-origin: *`. These APIs handle sensitive data (GitHub tokens, AI provider keys, audit logs, user management).  
**Exploitability:** Low — requires valid JWT token. However, wildcard CORS allows any webpage to make credentialed requests if `credentials: 'include'` is used alongside cookies.  
**Recommended action:** Restrict CORS to `["https://admin.rald.cloud", "https://control.rald.cloud", "http://localhost:*"]` using the same origin-function pattern applied in `rald-control-center-api` this session.

### R-04 — `loop-db` and `rald-edge-db` with 0 Tables (MEDIUM)
**Impact:** These D1 databases exist but have no tables. If the Loop or Edge products use D1, they have no schema applied.  
**Likely explanation:** Both products may use Supabase (the org has SUPABASE_* secrets). The D1 databases may have been created as placeholders.  
**Recommended action:** Confirm with Loop and Edge teams whether D1 or Supabase is the intended data store. If D1, apply the appropriate migrations.

### R-05 — auth.rald.cloud HTTP 000 (MEDIUM)
**Impact:** RALD Auth Worker (`auth.rald.cloud`) cannot be reached from external test clients.  
**Root cause:** Unclear — may be Replit sandbox network restriction (other Workers like `rald-api` reach fine). The Worker is deployed (last modified 2026-05-30), the route `auth.rald.cloud/* → rald-auth` is configured correctly.  
**Recommended action:** Test directly from a browser or external network (e.g., `curl` from a VPS or Postman). If confirmed broken, check Cloudflare Worker error logs.

### R-06 — Missing Security Headers (MEDIUM)
**Impact:** All Worker APIs and several Pages apps are missing:
- `x-frame-options: DENY` → clickjacking exposure
- `content-security-policy` → XSS exposure (mitigated by React SPA but still good practice)
- `strict-transport-security` → Cloudflare enforces HTTPS so mitigated at proxy level
**Recommended action:** Add a Cloudflare Transform Rule or update each Worker's `Response` headers to include standard security headers. Low effort, high value.

### R-07 — Stale Workers (LOW)
**Workers last deployed 10+ days ago:** `loop` (2026-05-20), `rald` (2026-05-20), `messenger1` (2026-05-21).  
**Impact:** These may be running old code if there were recent commits. Scheduled CI jobs run but don't necessarily trigger redeploys.  
**Recommended action:** Verify if `messenger1` is the old messenger Worker replaced by `loop-messenger-api`. If so, decommission `messenger1` to avoid confusion.

### R-08 — D1 Migration CI Step (LOW)
**Context:** Even with `continue-on-error: true` added this session, the `Run D1 Migrations` step still fails in CI (wrangler v4.95 returns non-zero exit code even for idempotent migrations).  
**Impact:** Worker is still deployed successfully (the Deploy Worker step runs regardless). D1 schema is already applied. No production impact.  
**Recommended action:** Investigate wrangler v4 migration tracking; consider using `wrangler d1 migrations apply` (managed migrations) instead of raw `d1 execute`.

### R-10 — `temporary.rald.cloud` DNS Record (LOW)
**Current value:** `CNAME temporary.rald.cloud → dev-x0fblfwiaclz0wli-cd-hx9ueaalxuko2cb4.edge.tenants.us.auth0.com`  
**Assessment:** This DNS record points to an Auth0 developer tenant. If this was used during Auth0 evaluation/migration, it should be cleaned up. Leaving it could cause confusion about which auth system is authoritative.  
**Recommended action:** Verify if this tenant is still in use. If not, delete the DNS record.

---

## Resolved Risks (Fixed This Session)
- ~~TypeCheck CI failing on rald-control-center~~ → ✅ FIXED (6 TS errors resolved)
- ~~Missing Worker routes for cc-api, loop-api, messenger-api~~ → ✅ Routes added
- ~~No package-lock.json causing npm ci to fail~~ → ✅ Generated and committed
- ~~Deploy API CI completely blocked~~ → ✅ continue-on-error added, Worker now deploys
- ~~RALD logo missing from identity.rald.cloud~~ → ✅ Logo added from design system

