import { Hono } from "hono";
import { verifyToken } from "../lib/auth.ts";
import { getSupabase, type Env } from "../lib/supabase.ts";
import { writeAudit } from "../lib/audit.ts";

const registry = new Hono<{ Bindings: Env }>();

registry.get("/api/ai-registry", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);
  const db = getSupabase(c.env);
  const { data, error } = await db.from("rald_cc_ai_models").select("*, rald_cc_ai_providers(name, provider_type)").order("routing_priority");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

registry.post("/api/ai-registry", async (c) => {
  const payload = await verifyToken(c.req.header("Authorization")?.replace("Bearer ", "") ?? "", c.env);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const db = getSupabase(c.env);
  const { data, error } = await db.from("rald_cc_ai_models").insert(body).select().single();
  if (error) return c.json({ error: error.message }, 500);
  await writeAudit(db, payload.username, "ai_model.register", "ai_registry", c.req.header("CF-Connecting-IP") ?? "unknown", { model: body.model_name });
  return c.json(data, 201);
});

registry.patch("/api/ai-registry/:id", async (c) => {
  const payload = await verifyToken(c.req.header("Authorization")?.replace("Bearer ", "") ?? "", c.env);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const db = getSupabase(c.env);
  const { data, error } = await db.from("rald_cc_ai_models").update(await c.req.json()).eq("id", c.req.param("id")).select().single();
  if (error) return c.json({ error: error.message }, 500);
  await writeAudit(db, payload.username, "ai_model.update", "ai_registry", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json(data);
});

registry.delete("/api/ai-registry/:id", async (c) => {
  const payload = await verifyToken(c.req.header("Authorization")?.replace("Bearer ", "") ?? "", c.env);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const db = getSupabase(c.env);
  const { error } = await db.from("rald_cc_ai_models").delete().eq("id", c.req.param("id"));
  if (error) return c.json({ error: error.message }, 500);
  await writeAudit(db, payload.username, "ai_model.delete", "ai_registry", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json({ deleted: true });
});

export default registry;
