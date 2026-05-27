import { Hono } from "hono";
import { verifyToken } from "../lib/auth.ts";
import { getSupabase, type Env } from "../lib/supabase.ts";
import { writeAudit } from "../lib/audit.ts";

const ai = new Hono<{ Bindings: Env }>();

async function requireAuth(c: { req: { header: (k: string) => string | undefined }; json: (d: unknown, s?: number) => Response; env: Env }) {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return verifyToken(token, c.env);
}

ai.get("/api/ai-providers", async (c) => {
  const payload = await requireAuth(c);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const db = getSupabase(c.env);
  const { data, error } = await db.from("rald_cc_ai_providers").select("*").order("routing_priority");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data?.map(p => ({ ...p, hasKey: !!p.api_key_encrypted })));
});

ai.post("/api/ai-providers", async (c) => {
  const payload = await requireAuth(c);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const db = getSupabase(c.env);
  const { api_key, ...rest } = body;
  const insert: Record<string, unknown> = { ...rest };
  if (api_key) insert.api_key_encrypted = api_key; // In production: encrypt with KMS
  const { data, error } = await db.from("rald_cc_ai_providers").insert(insert).select().single();
  if (error) return c.json({ error: error.message }, 500);
  await writeAudit(db, payload.username, "ai_provider.create", "ai_providers", c.req.header("CF-Connecting-IP") ?? "unknown", { name: body.name });
  return c.json(data, 201);
});

ai.patch("/api/ai-providers/:id", async (c) => {
  const payload = await requireAuth(c);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const { api_key, ...body } = await c.req.json();
  const db = getSupabase(c.env);
  const update: Record<string, unknown> = { ...body };
  if (api_key) update.api_key_encrypted = api_key;
  const { data, error } = await db.from("rald_cc_ai_providers").update(update).eq("id", c.req.param("id")).select().single();
  if (error) return c.json({ error: error.message }, 500);
  await writeAudit(db, payload.username, "ai_provider.update", "ai_providers", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json(data);
});

ai.delete("/api/ai-providers/:id", async (c) => {
  const payload = await requireAuth(c);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const db = getSupabase(c.env);
  const { error } = await db.from("rald_cc_ai_providers").delete().eq("id", c.req.param("id"));
  if (error) return c.json({ error: error.message }, 500);
  await writeAudit(db, payload.username, "ai_provider.delete", "ai_providers", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json({ deleted: true });
});

export default ai;
