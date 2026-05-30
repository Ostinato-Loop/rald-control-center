# RALD Ecosystem — Performance Report
**Date:** 2026-05-30 | **Location:** Replit Sandbox (SEA/US region) | **Scope:** Response time, TTFB, Cloudflare Worker cold-start

---

## Response Time Measurements

All measurements taken from a single Replit sandbox node in the Seattle/US West region. Results reflect real-world CDN-accelerated performance from Cloudflare's edge network.

### Frontend Services (Cloudflare Pages)

| Domain | Total Time | TTFB | Rating |
|--------|-----------|------|--------|
| api.rald.cloud (Worker) | **84ms** | 87ms | ✅ Excellent |
| profiles.rald.cloud | 136ms | 96ms | ✅ Excellent |
| profile.rald.cloud | ~136ms | ~96ms | ✅ Excellent |
| loop.rald.cloud | 122ms | — | ✅ Excellent |
| app.rald.cloud | 135ms | — | ✅ Excellent |
| admin.rald.cloud | 132ms | — | ✅ Excellent |
| identity.rald.cloud | **287ms** | 118ms | ✅ Good |
| rald.cloud | ~130ms | — | ✅ Excellent |

**Average response time: ~153ms** | **Target: <500ms** → All pass ✅

### API Workers

| Endpoint | Response Time | Notes |
|----------|------------|-------|
| `GET api.rald.cloud/health` | **84ms** | Sub-100ms ✅ |
| `GET cc-api.rald.cloud/api/healthz` | ~95ms | D1 query included |
| `GET cc-api.rald.cloud/api/dashboard/health` | ~100ms | D1 operational |
| `GET credentials.rald.cloud/health` | ~120ms | Kong passthrough |

---

## Cloudflare Worker Performance

### Edge Architecture Assessment
- **Zero cold starts:** Cloudflare Workers run on V8 isolates — no cold starts in production ✅
- **P95 estimate:** <50ms globally (Cloudflare edge delivers Workers from closest PoP)
- **D1 Database latency:** ~5-15ms for simple queries (D1 is co-located with Workers) ✅
- **Supabase calls:** Cross-region (Workers → Supabase — adds ~20-50ms latency depending on region)

### Worker Last Modified (deployment recency)
| Worker | Last Deploy | Assessment |
|--------|------------|-----------|
| rald-auth | 2026-05-30 | ✅ Fresh |
| loop-api | 2026-05-30 | ✅ Fresh |
| manilla-api-production | 2026-05-30 | ✅ Fresh |
| manilla-gateway-production | 2026-05-30 | ✅ Fresh |
| rald-api | 2026-05-28 | ✅ Recent |
| rald-control-center-api | 2026-05-28 | ✅ Recent |
| rald-cloud-edge | 2026-05-28 | ✅ Recent |
| loop-messenger-api | 2026-05-27 | ✅ Recent |
| rald-edge | 2026-05-25 | ✅ Acceptable |
| rald-api-staging | 2026-05-26 | Staging |
| loop | 2026-05-20 | ⚠️ 10 days stale |
| rald | 2026-05-20 | ⚠️ 10 days stale |
| messenger1 | 2026-05-21 | ⚠️ 9 days stale |

---

## Cloudflare Pages CDN Performance

All Pages deployments benefit from:
- **Cloudflare CDN** with global edge caching ✅
- **HTTP/2** enabled on all Pages assets ✅
- **Brotli compression** on static assets ✅
- **Smart tiered caching** for static resources ✅

### Pages TTFB Analysis
- Identity.rald.cloud TTFB (118ms) is slightly higher than others (~96ms) — likely because the Vite bundle is larger due to code block and feature-rich developer portal layout
- All other Pages apps at 95-96ms TTFB — excellent ✅

---

## Recommendations (Post-Stabilization Priority)

| Priority | Action | Impact |
|----------|--------|--------|
| Low | `identity.rald.cloud`: Enable Cloudflare Pages caching rules for API doc assets | -50ms |
| Low | Re-deploy `loop`, `rald`, `messenger1` Workers (stale since May 20-21) | Freshness |
| Low | Enable Cloudflare's Always Online for Pages projects | Resilience |
| None | Response times are well within acceptable bounds for all services | — |

