// RALD WIZMAC — Service Health Aggregator | Task 7 | LILCKY STUDIO LIMITED
import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { verifyToken } from "../lib/auth.ts";

const wizmac = new Hono<{ Bindings: Env }>();

const SERVICES = [
  { name: "rald-auth",     domain: "auth.rald.cloud",         label: "Auth",      layer: "identity"  },
  { name: "rald-auth-ui",  domain: "profiles.rald.cloud",     label: "Profiles",  layer: "identity"  },
  { name: "loop-api",      domain: "loop-api.rald.cloud",     label: "Loop API",  layer: "community" },
  { name: "messenger",     domain: "messenger.rald.cloud",    label: "Messenger", layer: "community" },
  { name: "rald-notify",   domain: "notification.rald.cloud", label: "Notify",    layer: "platform"  },
  { name: "rald-search",   domain: "search.rald.cloud",       label: "Search",    layer: "platform"  },
  { name: "rald-inbox",    domain: "inbox.rald.cloud",        label: "Inbox",     layer: "platform"  },
  { name: "rald-realtime", domain: "realtime.rald.cloud",     label: "Realtime",  layer: "platform"  },
] as const;

async function checkService(domain: string) {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://${domain}/api/health`, {
      signal: controller.signal,
      headers: { "User-Agent": "RALD-WIZMAC/1.0", "X-WIZMAC-CHECK": "1" },
    });
    clearTimeout(timer);
    const ms = Date.now() - start;
    if (res.status === 200) return { status: "healthy" as const, latency_ms: ms, http_code: 200 };
    if (res.status === 503) return { status: "down" as const, latency_ms: ms, http_code: 503, error: "Service misconfigured" };
    if (res.status >= 500) return { status: "degraded" as const, latency_ms: ms, http_code: res.status, error: `HTTP ${res.status}` };
    return { status: "healthy" as const, latency_ms: ms, http_code: res.status };
  } catch (e: unknown) {
    return { status: "down" as const, latency_ms: Date.now() - start, http_code: 0, error: e instanceof Error ? e.message : "Unknown" };
  }
}

wizmac.get("/api/admin/status", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ", "") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const now = new Date().toISOString();
  const results = await Promise.all(SERVICES.map(async s => ({ ...s, ...(await checkService(s.domain)), checked_at: now })));
  const healthy = results.filter(s => s.status === "healthy").length;
  const degraded = results.filter(s => s.status === "degraded").length;
  const down = results.filter(s => s.status === "down").length;
  const byLayer: Record<string, { total: number; healthy: number; down: number }> = {};
  for (const svc of results) {
    if (!byLayer[svc.layer]) byLayer[svc.layer] = { total: 0, healthy: 0, down: 0 };
    byLayer[svc.layer].total++;
    if (svc.status === "healthy") byLayer[svc.layer].healthy++;
    if (svc.status === "down")    byLayer[svc.layer].down++;
  }
  return c.json({
    summary: { total: results.length, healthy, degraded, down,
      overall: down > 2 ? "critical" : (down > 0 || degraded > 0) ? "degraded" : "healthy", checked_at: now },
    by_layer: byLayer, services: results,
  });
});

wizmac.get("/api/admin/status/:name", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ", "") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const svc = SERVICES.find(s => s.name === c.req.param("name"));
  if (!svc) return c.json({ error: "Unknown service", valid: SERVICES.map(s => s.name) }, 404);
  return c.json({ ...svc, ...(await checkService(svc.domain)), checked_at: new Date().toISOString() });
});

export default wizmac;
