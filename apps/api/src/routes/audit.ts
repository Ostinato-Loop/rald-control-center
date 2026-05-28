import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { verifyToken } from "../lib/auth.ts";

const audit = new Hono<{ Bindings: Env }>();

audit.get("/api/audit", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const limit = Math.min(Number(c.req.query("limit") ?? "50"), 500);
  const { results } = await c.env.DB.prepare("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?").bind(limit).all();
  return c.json(results);
});

export default audit;
