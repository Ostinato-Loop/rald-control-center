import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { verifyToken } from "../lib/auth.ts";
import { writeAudit } from "../lib/audit.ts";

const ai = new Hono<{ Bindings: Env }>();

ai.get("/api/ai-providers", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const { results } = await c.env.DB.prepare("SELECT * FROM ai_providers ORDER BY routing_priority").all();
  return c.json(results.map((r:Record<string,unknown>) => ({ ...r, hasKey: !!r.api_key_encrypted })));
});

ai.post("/api/ai-providers", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO ai_providers (id,name,provider_type,is_active,api_key_encrypted,routing_priority,supported_languages) VALUES (?,?,?,?,?,?,?)"
  ).bind(id, body.name, body.provider_type, body.is_active?1:0, body.api_key??null, body.routing_priority??99, JSON.stringify(body.supported_languages??["en"])).run();
  await writeAudit(c.env.DB, p.username, "ai_provider.create", "ai_providers", c.req.header("CF-Connecting-IP")??"unknown", { name: body.name });
  return c.json(await c.env.DB.prepare("SELECT * FROM ai_providers WHERE id=?").bind(id).first(), 201);
});

ai.patch("/api/ai-providers/:id", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const id = c.req.param("id");
  const sets:string[] = []; const vals:unknown[] = [];
  for (const [k,v] of Object.entries(body)) { if(k==="id") continue; sets.push(`${k}=?`); vals.push(v); }
  if (sets.length) { vals.push(id); await c.env.DB.prepare(`UPDATE ai_providers SET ${sets.join(",")},updated_at=datetime('now') WHERE id=?`).bind(...vals).run(); }
  await writeAudit(c.env.DB, p.username, "ai_provider.update", "ai_providers", c.req.header("CF-Connecting-IP")??"unknown");
  return c.json(await c.env.DB.prepare("SELECT * FROM ai_providers WHERE id=?").bind(id).first());
});

ai.delete("/api/ai-providers/:id", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  await c.env.DB.prepare("DELETE FROM ai_providers WHERE id=?").bind(c.req.param("id")).run();
  await writeAudit(c.env.DB, p.username, "ai_provider.delete", "ai_providers", c.req.header("CF-Connecting-IP")??"unknown");
  return c.json({ deleted: true });
});

export default ai;
