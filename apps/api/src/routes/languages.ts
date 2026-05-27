import { Hono } from "hono";
import { verifyToken } from "../lib/auth.ts";
import { getSupabase, type Env } from "../lib/supabase.ts";
import { writeAudit } from "../lib/audit.ts";

const langs = new Hono<{ Bindings: Env }>();

langs.get("/api/languages", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);
  const db = getSupabase(c.env);
  const { data, error } = await db.from("language_packs").select("*").order("language_name");
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

langs.post("/api/languages", async (c) => {
  const payload = (await verifyToken(c.req.header("Authorization")?.replace("Bearer ", "") ?? "", c.env));
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const db = getSupabase(c.env);
  const { data, error } = await db.from("language_packs").insert(body).select().single();
  if (error) return c.json({ error: error.message }, 500);
  await writeAudit(db, payload.username, "language.create", "languages", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json(data, 201);
});

langs.patch("/api/languages/:id", async (c) => {
  const payload = (await verifyToken(c.req.header("Authorization")?.replace("Bearer ", "") ?? "", c.env));
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const db = getSupabase(c.env);
  const { data, error } = await db.from("language_packs").update(await c.req.json()).eq("id", c.req.param("id")).select().single();
  if (error) return c.json({ error: error.message }, 500);
  await writeAudit(db, payload.username, "language.update", "languages", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json(data);
});

export default langs;
