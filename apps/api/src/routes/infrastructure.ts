import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { verifyToken } from "../lib/auth.ts";

const infra = new Hono<{ Bindings: Env }>();

infra.get("/api/infrastructure/health", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);

  const t = Date.now();
  const checks = await Promise.allSettled([
    fetch("https://api.github.com/orgs/Ostinato-Loop", {
      headers: { Authorization: `Bearer ${c.env.GITHUB_TOKEN}`, "User-Agent": "RALD-Control-Center/2.0" },
    }).then(r => ({ name: "GitHub API", status: r.ok || r.status===301?"operational":"degraded" as const, latencyMs: Date.now()-t }))
      .catch(() => ({ name: "GitHub API", status: "unreachable" as const, latencyMs: 0 })),
    fetch(c.env.N8N_URL.replace(/\/mcp-server.*$/,"").replace(/\/$/,"") + "/healthz")
      .then(r => ({ name: "n8n", status: r.ok?"operational":"degraded" as const, latencyMs: Date.now()-t }))
      .catch(() => ({ name: "n8n", status: "unreachable" as const, latencyMs: 0 })),
    fetch(`https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}`, {
      headers: { Authorization: `Bearer ${c.env.CLOUDFLARE_API_TOKEN}` },
    }).then(r => ({ name: "Cloudflare API", status: r.ok?"operational":"degraded" as const, latencyMs: Date.now()-t }))
      .catch(() => ({ name: "Cloudflare API", status: "unreachable" as const, latencyMs: 0 })),
    c.env.DB.prepare("SELECT 1").first()
      .then(() => ({ name: "Cloudflare D1", status: "operational" as const, latencyMs: Date.now()-t }))
      .catch(() => ({ name: "Cloudflare D1", status: "error" as const, latencyMs: 0 })),
  ]);

  const services = checks.map(r => r.status==="fulfilled" ? r.value : { name:"unknown", status:"error" as const, latencyMs:0 });
  const allOk = services.every(s => s.status === "operational");
  return c.json({ overall: allOk?"healthy":"degraded", services, checkedAt: new Date().toISOString() });
});

infra.get("/api/infrastructure/cloudflare/workers", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts`, {
    headers: { Authorization: `Bearer ${c.env.CLOUDFLARE_API_TOKEN}` },
  });
  return c.json(await res.json());
});

infra.get("/api/infrastructure/cloudflare/pages", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/pages/projects`, {
    headers: { Authorization: `Bearer ${c.env.CLOUDFLARE_API_TOKEN}` },
  });
  return c.json(await res.json());
});

export default infra;
