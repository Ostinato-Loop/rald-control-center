import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { signToken, verifyToken, hashPassword, verifyPassword } from "../lib/auth.ts";
import { writeAudit } from "../lib/audit.ts";

const auth = new Hono<{ Bindings: Env }>();

auth.post("/api/auth/login", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ error: "Missing credentials" }, 400);
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE username=? AND is_active=1"
  ).bind(username).first<{ id:string;username:string;email:string;role:string;password_hash:string }>();
  if (!user) return c.json({ error: "Unauthorized", message: "Invalid credentials" }, 401);
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return c.json({ error: "Unauthorized", message: "Invalid credentials" }, 401);
  const token = await signToken({ id: user.id, username: user.username, role: user.role }, c.env);
  await c.env.DB.prepare("UPDATE users SET last_login=? WHERE id=?").bind(new Date().toISOString(), user.id).run();
  await writeAudit(c.env.DB, username, "auth.login", "auth", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json({ token, user: { id:user.id, username:user.username, email:user.email, role:user.role } });
});

auth.post("/api/auth/logout", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (token) {
    const p = await verifyToken(token, c.env);
    if (p) await writeAudit(c.env.DB, p.username, "auth.logout", "auth", c.req.header("CF-Connecting-IP") ?? "unknown");
  }
  return c.json({ message: "Logged out" });
});

auth.get("/api/auth/me", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  const payload = await verifyToken(token, c.env);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const user = await c.env.DB.prepare(
    "SELECT id,username,email,role,created_at FROM users WHERE id=?"
  ).bind(payload.id).first<{id:string;username:string;email:string;role:string;created_at:string}>();
  if (!user) return c.json({ error: "Not found" }, 404);
  return c.json({ id:user.id, username:user.username, email:user.email, role:user.role, createdAt:user.created_at });
});

auth.post("/api/auth/setup-admin", async (c) => {
  const row = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM users WHERE role='admin'").first<{cnt:number}>();
  if (row && row.cnt > 0) return c.json({ error: "Admin already exists" }, 409);
  const { username, email, password } = await c.req.json();
  const hash = await hashPassword(password);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO users (id,username,email,password_hash,role,is_active) VALUES (?,?,?,?,'admin',1)"
  ).bind(id, username, email, hash).run();
  return c.json({ message: "Admin created", id });
});

export default auth;
