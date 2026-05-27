import { Hono } from "hono";
import { verifyToken } from "../lib/auth.ts";
import { type Env } from "../lib/supabase.ts";

const infra = new Hono<{ Bindings: Env }>();

infra.get("/api/infrastructure/health", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);

  const checks = await Promise.allSettled([
    fetch("https://api.github.com", { headers: { Authorization: `token ${c.env.GITHUB_TOKEN}` } })
      .then(r => ({ name: "GitHub", status: r.ok ? "operational" : "degraded" })),
    fetch(`${c.env.N8N_URL}/api/v1/workflows?limit=1`, { headers: { "X-N8N-API-KEY": c.env.N8N_API_KEY } })
      .then(r => ({ name: "n8n", status: r.ok ? "operational" : "degraded" }))
      .catch(() => ({ name: "n8n", status: "unreachable" })),
    fetch(`https://api.cloudflare.com/client/v4/user/tokens/verify`, {
      headers: { Authorization: `Bearer ${c.env.CLOUDFLARE_API_TOKEN}` },
    }).then(r => ({ name: "Cloudflare", status: r.ok ? "operational" : "degraded" })),
  ]);

  const services = checks.map(r => r.status === "fulfilled" ? r.value : { name: "unknown", status: "error" });
  const allHealthy = services.every(s => s.status === "operational");

  return c.json({ overall: allHealthy ? "healthy" : "degraded", services, checkedAt: new Date().toISOString() });
});

infra.get("/api/infrastructure/cloudflare/zones", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);
  const res = await fetch("https://api.cloudflare.com/client/v4/zones?name=rald.cloud", {
    headers: { Authorization: `Bearer ${c.env.CLOUDFLARE_API_TOKEN}` },
  });
  const data = await res.json();
  return c.json(data);
});

infra.get("/api/infrastructure/cloudflare/workers", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/workers/scripts`, {
    headers: { Authorization: `Bearer ${c.env.CLOUDFLARE_API_TOKEN}` },
  });
  const data = await res.json();
  return c.json(data);
});

export default infra;
