import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { verifyToken } from "../lib/auth.ts";
import { writeAudit } from "../lib/audit.ts";

const n8n = new Hono<{ Bindings: Env }>();

// n8n cloud REST API uses /rest/ path with X-N8N-API-KEY header
async function n8nFetch(path: string, env: Env, options: RequestInit = {}) {
  const base = env.N8N_URL.replace(/\/mcp-server.*$/, "").replace(/\/$/, "");
  const res = await fetch(`${base}/rest${path}`, {
    ...options,
    headers: {
      "X-N8N-API-KEY": env.N8N_API_KEY,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (res.status === 401) throw new Error("n8n authentication failed — check N8N_API_KEY");
  if (!res.ok) throw new Error(`n8n ${res.status}: ${await res.text()}`);
  return res.json();
}

n8n.get("/api/n8n/status", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const base = (c.env.N8N_URL ?? "").replace(/\/mcp-server.*$/, "");
  try {
    const data = await n8nFetch("/workflows?limit=1&active=true", c.env) as { data?: unknown[] };
    return c.json({ connected: true, url: base, workflows: data.data?.length ?? 0 });
  } catch (e: unknown) {
    return c.json({ connected: false, url: base, error: String(e) });
  }
});

n8n.get("/api/n8n/workflows", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  try {
    const data = await n8nFetch("/workflows?limit=100", c.env);
    return c.json(data);
  } catch (e: unknown) { return c.json({ error: String(e), data: [] }, 502); }
});

n8n.get("/api/n8n/executions", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  try {
    const limit = c.req.query("limit") ?? "50";
    const data = await n8nFetch(`/executions?limit=${limit}`, c.env);
    return c.json(data);
  } catch (e: unknown) { return c.json({ error: String(e), data: [] }, 502); }
});

n8n.post("/api/n8n/workflows/:id/activate", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  try {
    const data = await n8nFetch(`/workflows/${c.req.param("id")}/activate`, c.env, { method: "POST" });
    await writeAudit(c.env.DB, p.username, "n8n.activate_workflow", "n8n", c.req.header("CF-Connecting-IP")??"unknown", { workflowId: c.req.param("id") });
    return c.json(data);
  } catch (e: unknown) { return c.json({ error: String(e) }, 502); }
});

n8n.post("/api/n8n/workflows/:id/deactivate", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  try {
    const data = await n8nFetch(`/workflows/${c.req.param("id")}/deactivate`, c.env, { method: "POST" });
    await writeAudit(c.env.DB, p.username, "n8n.deactivate_workflow", "n8n", c.req.header("CF-Connecting-IP")??"unknown", { workflowId: c.req.param("id") });
    return c.json(data);
  } catch (e: unknown) { return c.json({ error: String(e) }, 502); }
});

n8n.post("/api/n8n/webhook/:webhookId", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const base = (c.env.N8N_URL ?? "").replace(/\/mcp-server.*$/, "").replace(/\/$/, "");
  const body = await c.req.json().catch(() => ({}));
  const res = await fetch(`${base}/webhook/${c.req.param("webhookId")}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  const result = await res.json();
  await writeAudit(c.env.DB, p.username, "n8n.webhook_trigger", "n8n", c.req.header("CF-Connecting-IP")??"unknown", { webhookId: c.req.param("webhookId") });
  return c.json(result, res.ok ? 200 : 502);
});

export default n8n;
