import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { verifyToken } from "../lib/auth.ts";
import { writeAudit } from "../lib/audit.ts";

const langs = new Hono<{ Bindings: Env }>();

langs.get("/api/languages", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const { results } = await c.env.DB.prepare("SELECT * FROM language_packs ORDER BY language_name").all();
  return c.json(results);
});

langs.post("/api/languages", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json(); const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO language_packs (id,language_code,language_name,is_active,dialect_count,slang_entries,voice_accent_count,translation_memory_size,accuracy) VALUES (?,?,?,?,?,?,?,?,?)"
  ).bind(id, body.language_code, body.language_name, body.is_active?1:0, body.dialect_count??0, body.slang_entries??0, body.voice_accent_count??0, body.translation_memory_size??0, body.accuracy??0).run();
  await writeAudit(c.env.DB, p.username, "language.create", "languages", c.req.header("CF-Connecting-IP")??"unknown");
  return c.json(await c.env.DB.prepare("SELECT * FROM language_packs WHERE id=?").bind(id).first(), 201);
});

langs.patch("/api/languages/:id", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json(); const id = c.req.param("id");
  const sets:string[] = []; const vals:unknown[] = [];
  for (const [k,v] of Object.entries(body)) { if(k==="id") continue; sets.push(`${k}=?`); vals.push(v); }
  if (sets.length) { vals.push(id); await c.env.DB.prepare(`UPDATE language_packs SET ${sets.join(",")},last_updated=datetime('now') WHERE id=?`).bind(...vals).run(); }
  await writeAudit(c.env.DB, p.username, "language.update", "languages", c.req.header("CF-Connecting-IP")??"unknown");
  return c.json(await c.env.DB.prepare("SELECT * FROM language_packs WHERE id=?").bind(id).first());
});

export default langs;
