import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { Env } from "./lib/db.ts";

import auth from "./routes/auth.ts";
import github from "./routes/github.ts";
import aiProviders from "./routes/ai-providers.ts";
import aiRegistry from "./routes/ai-registry.ts";
import n8n from "./routes/n8n.ts";
import infra from "./routes/infrastructure.ts";
import langs from "./routes/languages.ts";
import audit from "./routes/audit.ts";
import dashboard from "./routes/dashboard.ts";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", cors({
  origin: [
    "https://control.rald.cloud",
    "https://rald-control-center.pages.dev",
    "http://localhost:5173",
    "http://localhost:3000",
    /\.rald-control-center\.pages\.dev$/,
    /\.replit\.dev$/,
    /\.repl\.co$/,
  ],
  allowHeaders: ["Authorization", "Content-Type"],
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
}));

app.get("/", c => c.json({ service: "RALD Control Center API", version: "2.0.0", db: "d1", status: "operational" }));
app.get("/health", c => c.json({ status: "ok", ts: new Date().toISOString() }));

// All core route modules
app.route("/", auth);
app.route("/", github);
app.route("/", aiProviders);
app.route("/", aiRegistry);
app.route("/", n8n);
app.route("/", infra);
app.route("/", langs);
app.route("/", audit);
app.route("/", dashboard);

// ── Aliases expected by the generated API client ────────────────────────────

// healthz
app.get("/api/healthz", c => c.json({ status: "ok", db: "d1", ts: new Date().toISOString(), version: "2.0.0" }));

// GitHub repos list + sync aliases
app.get("/api/github/repos", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ","") ?? "";
  const newReq = new Request(new URL("/api/github/repos", c.req.url), { method: "GET", headers: c.req.raw.headers });
  return c.env as unknown as Response || (await app.fetch(newReq, c.env));
});

app.post("/api/github/repos/sync", async (c) => {
  const headers = new Headers(c.req.raw.headers);
  const newReq = new Request(new URL("/api/github/sync", c.req.url).toString(), { method: "POST", headers });
  return app.fetch(newReq, c.env);
});

app.get("/api/github/stats", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const repos = await c.env.DB.prepare("SELECT * FROM github_repos").all();
  const byLang: Record<string,number> = {}; const byCategory: Record<string,number> = {};
  let totalStars = 0; let totalIssues = 0;
  for (const r of repos.results as Record<string,unknown>[]) {
    const lang = (r.language as string) ?? "Unknown"; byLang[lang] = (byLang[lang]??0)+1;
    const cat = (r.category as string) ?? "Other"; byCategory[cat] = (byCategory[cat]??0)+1;
    totalStars += Number(r.stars)||0; totalIssues += Number(r.open_issues)||0;
  }
  return c.json({ totalRepos: repos.results.length, totalStars, totalOpenIssues: totalIssues, byLanguage: byLang, byCategory });
});

// AI providers cost summary alias
app.get("/api/ai-providers/costs/summary", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const ngnRate = 1372;
  const { results } = await c.env.DB.prepare("SELECT * FROM ai_providers ORDER BY routing_priority").all();
  const byProvider = (results as Record<string,unknown>[]).map(r => ({
    provider: r.name, providerType: r.provider_type, totalTokens: r.total_tokens_used,
    totalCostUsd: r.total_cost_usd, totalCostNgn: Math.round(Number(r.total_cost_usd) * ngnRate),
    requestCount: r.request_count, failureCount: r.failure_count,
  }));
  const totalUsd = byProvider.reduce((s,r) => s + Number(r.totalCostUsd), 0);
  return c.json({ totalCostUsd: totalUsd, totalCostNgn: Math.round(totalUsd * ngnRate), byProvider, fx: { usdToNgn: ngnRate } });
});

// AI provider health alias
app.get("/api/ai-providers/:id/health", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const provider = await c.env.DB.prepare("SELECT * FROM ai_providers WHERE id=?").bind(c.req.param("id")).first<Record<string,unknown>>();
  if (!provider) return c.json({ error: "Not found" }, 404);
  return c.json({ id: provider.id, name: provider.name, status: provider.is_active ? "healthy" : "inactive", latencyMs: provider.avg_latency_ms, requestCount: provider.request_count });
});

// AI provider rotate-key alias
app.post("/api/ai-providers/:id/rotate-key", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const { newKey } = await c.req.json().catch(() => ({})) as { newKey?: string };
  if (!newKey) return c.json({ error: "newKey required" }, 400);
  await c.env.DB.prepare("UPDATE ai_providers SET api_key_encrypted=?,updated_at=datetime('now') WHERE id=?").bind(newKey, c.req.param("id")).run();
  return c.json({ message: "Key rotated" });
});

// n8n stats alias
app.get("/api/n8n/stats", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const base = (c.env.N8N_URL ?? "").replace(/\/mcp-server.*$/, "").replace(/\/$/, "");
  try {
    const wf = await fetch(`${base}/rest/workflows?limit=100`, { headers: { "X-N8N-API-KEY": c.env.N8N_API_KEY } });
    const data = await wf.json() as { data: {id:string;active:boolean}[] };
    const total = data.data?.length ?? 0;
    const active = data.data?.filter((w:{active:boolean}) => w.active)?.length ?? 0;
    return c.json({ total, active, inactive: total - active, connected: true });
  } catch { return c.json({ total: 0, active: 0, inactive: 0, connected: false }); }
});

// n8n workflow toggle alias
app.patch("/api/n8n/workflows/:id/toggle", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const { active } = await c.req.json() as { active: boolean };
  const base = (c.env.N8N_URL ?? "").replace(/\/mcp-server.*$/, "").replace(/\/$/, "");
  const path = active ? "activate" : "deactivate";
  const res = await fetch(`${base}/rest/workflows/${c.req.param("id")}/${path}`, {
    method: "POST", headers: { "X-N8N-API-KEY": c.env.N8N_API_KEY, "Content-Type": "application/json" },
  });
  return c.json(await res.json());
});

// n8n workflow trigger alias
app.post("/api/n8n/workflows/:id/trigger", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const base = (c.env.N8N_URL ?? "").replace(/\/mcp-server.*$/, "").replace(/\/$/, "");
  const res = await fetch(`${base}/rest/workflows/${c.req.param("id")}/execute`, {
    method: "POST", headers: { "X-N8N-API-KEY": c.env.N8N_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  return c.json(await res.json());
});

// Queues status alias (placeholder — no queue system in use yet)
app.get("/api/queues/status", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ total: 0, active: 0, waiting: 0, completed: 0, failed: 0, status: "idle", queues: [] });
});

// Infrastructure aliases
app.get("/api/infrastructure/status", async (c) => {
  const headers = new Headers(c.req.raw.headers);
  const newReq = new Request(new URL("/api/infrastructure/health", c.req.url).toString(), { method: "GET", headers });
  return app.fetch(newReq, c.env);
});

app.get("/api/infrastructure/cloudflare", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const [workers, pages] = await Promise.all([
    fetch(`https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts`, { headers: { Authorization: `Bearer ${c.env.CLOUDFLARE_API_TOKEN}` } }).then(r => r.json()),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects`, { headers: { Authorization: `Bearer ${c.env.CLOUDFLARE_API_TOKEN}` } }).then(r => r.json()),
  ]);
  return c.json({ status: "operational", workers: (workers as {result?:unknown[]}).result ?? [], pages: (pages as {result?:unknown[]}).result ?? [] });
});

app.get("/api/infrastructure/aws", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ status: "operational", region: c.env.AWS_REGION || "eu-west-1", services: [] });
});

app.get("/api/infrastructure/supabase", async (c) => {
  const { verifyToken } = await import("./lib/auth.ts");
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  return c.json({ status: "operational", url: c.env.SUPABASE_URL ? "configured" : "not_configured" });
});

// Audit logs alias with pagination
app.get("/api/audit-logs", async (c) => {
  const headers = new Headers(c.req.raw.headers);
  const url = new URL("/api/audit", c.req.url);
  url.search = new URL(c.req.url).search;
  const newReq = new Request(url.toString(), { method: "GET", headers });
  return app.fetch(newReq, c.env);
});

app.notFound(c => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error("[Worker Error]", err.message);
  return c.json({ error: "Internal server error", message: err.message }, 500);
});

export default app;
