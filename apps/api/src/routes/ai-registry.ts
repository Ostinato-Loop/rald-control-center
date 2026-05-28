import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { verifyToken } from "../lib/auth.ts";
import { writeAudit } from "../lib/audit.ts";

const registry = new Hono<{ Bindings: Env }>();

registry.get("/api/ai-registry", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const { results } = await c.env.DB.prepare(
    "SELECT m.*, p.name as provider_name, p.provider_type FROM ai_models m LEFT JOIN ai_providers p ON m.provider_id=p.id ORDER BY m.routing_priority"
  ).all();
  return c.json(results);
});

registry.post("/api/ai-registry", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO ai_models (id,provider_id,model_name,display_name,capabilities,language_support,context_window,avg_cost_per_1k,avg_latency_ms,routing_priority,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  ).bind(id, body.provider_id??null, body.model_name, body.display_name??body.model_name, JSON.stringify(body.capabilities??[]), JSON.stringify(body.language_support??["en"]), body.context_window??4096, body.avg_cost_per_1k??0, body.avg_latency_ms??0, body.routing_priority??99, body.is_active?1:0).run();
  await writeAudit(c.env.DB, p.username, "ai_model.register", "ai_registry", c.req.header("CF-Connecting-IP")??"unknown", { model: body.model_name });
  return c.json(await c.env.DB.prepare("SELECT * FROM ai_models WHERE id=?").bind(id).first(), 201);
});

registry.patch("/api/ai-registry/:id", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json(); const id = c.req.param("id");
  const sets:string[] = []; const vals:unknown[] = [];
  for (const [k,v] of Object.entries(body)) { if(k==="id") continue; sets.push(`${k}=?`); vals.push(typeof v==="object"?JSON.stringify(v):v); }
  if (sets.length) { vals.push(id); await c.env.DB.prepare(`UPDATE ai_models SET ${sets.join(",")} WHERE id=?`).bind(...vals).run(); }
  await writeAudit(c.env.DB, p.username, "ai_model.update", "ai_registry", c.req.header("CF-Connecting-IP")??"unknown");
  return c.json(await c.env.DB.prepare("SELECT * FROM ai_models WHERE id=?").bind(id).first());
});

registry.delete("/api/ai-registry/:id", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  await c.env.DB.prepare("DELETE FROM ai_models WHERE id=?").bind(c.req.param("id")).run();
  await writeAudit(c.env.DB, p.username, "ai_model.delete", "ai_registry", c.req.header("CF-Connecting-IP")??"unknown");
  return c.json({ deleted: true });
});

export default registry;
