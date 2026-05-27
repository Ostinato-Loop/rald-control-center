import { Hono } from "hono";
import { verifyToken } from "../lib/auth.ts";
import { getSupabase, type Env } from "../lib/supabase.ts";

const audit = new Hono<{ Bindings: Env }>();

audit.get("/api/audit", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);
  const db = getSupabase(c.env);
  const limit = Math.min(Number(c.req.query("limit") ?? "50"), 500);
  const { data, error } = await db.from("rald_cc_audit_logs").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

export default audit;
