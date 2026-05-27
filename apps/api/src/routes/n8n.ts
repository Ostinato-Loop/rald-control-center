import { Hono } from "hono";
import { verifyToken } from "../lib/auth.ts";
import { getSupabase, type Env } from "../lib/supabase.ts";
import { writeAudit } from "../lib/audit.ts";

const n8n = new Hono<{ Bindings: Env }>();

async function n8nFetch(path: string, env: Env, options: RequestInit = {}) {
  const res = await fetch(`${env.N8N_URL}${path}`, {
    ...options,
    headers: {
      "X-N8N-API-KEY": env.N8N_API_KEY,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n error ${res.status}: ${text}`);
  }
  return res.json();
}

n8n.get("/api/n8n/workflows", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);
  try {
    const data = await n8nFetch("/api/v1/workflows?limit=100", c.env);
    return c.json(data);
  } catch (e: unknown) {
    return c.json({ error: String(e) }, 502);
  }
});

n8n.get("/api/n8n/executions", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);
  try {
    const limit = c.req.query("limit") ?? "50";
    const data = await n8nFetch(`/api/v1/executions?limit=${limit}`, c.env);
    return c.json(data);
  } catch (e: unknown) {
    return c.json({ error: String(e) }, 502);
  }
});

n8n.post("/api/n8n/workflows/:id/trigger", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  const payload = token ? await verifyToken(token, c.env) : null;
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json().catch(() => ({}));
  try {
    const data = await n8nFetch(`/api/v1/workflows/${c.req.param("id")}/activate`, c.env, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const db = getSupabase(c.env);
    await writeAudit(db, payload.username, "n8n.trigger_workflow", "n8n", c.req.header("CF-Connecting-IP") ?? "unknown", { workflowId: c.req.param("id") });
    return c.json(data);
  } catch (e: unknown) {
    return c.json({ error: String(e) }, 502);
  }
});

export default n8n;
