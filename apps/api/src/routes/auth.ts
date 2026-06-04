import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { signToken, verifyToken, hashPassword, verifyPassword } from "../lib/auth.ts";
import { writeAudit } from "../lib/audit.ts";

const auth = new Hono<{ Bindings: Env }>();

// Login — accepts username OR email in the username field
auth.post("/api/auth/login", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ error: "Missing credentials" }, 400);
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE (username=? OR email=?) AND is_active=1"
  ).bind(username, username).first<{ id:string;username:string;email:string;role:string;password_hash:string }>();
  if (!user) return c.json({ error: "Unauthorized", message: "Invalid credentials" }, 401);
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return c.json({ error: "Unauthorized", message: "Invalid credentials" }, 401);
  const token = await signToken({ id: user.id, username: user.username, role: user.role }, c.env);
  await c.env.DB.prepare("UPDATE users SET last_login=? WHERE id=?").bind(new Date().toISOString(), user.id).run();
  await writeAudit(c.env.DB, user.username, "auth.login", "auth", c.req.header("CF-Connecting-IP") ?? "unknown");
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

// Change password — requires valid session token + current password
auth.patch("/api/auth/change-password", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  const payload = await verifyToken(token, c.env);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const { currentPassword, newPassword } = await c.req.json().catch(() => ({})) as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) return c.json({ error: "currentPassword and newPassword are required" }, 400);
  if (newPassword.length < 8) return c.json({ error: "New password must be at least 8 characters" }, 400);
  const user = await c.env.DB.prepare(
    "SELECT * FROM users WHERE id=? AND is_active=1"
  ).bind(payload.id).first<{ id:string;username:string;password_hash:string }>();
  if (!user) return c.json({ error: "User not found" }, 404);
  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) return c.json({ error: "Current password is incorrect" }, 401);
  const newHash = await hashPassword(newPassword);
  await c.env.DB.prepare(
    "UPDATE users SET password_hash=?, updated_at=datetime('now') WHERE id=?"
  ).bind(newHash, payload.id).run();
  await writeAudit(c.env.DB, user.username, "auth.change_password", "auth", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json({ message: "Password changed successfully" });
});

// First-time admin bootstrap — only works when NO admin exists in the DB
auth.post("/api/auth/setup-admin", async (c) => {
  const row = await c.env.DB.prepare("SELECT COUNT(*) as cnt FROM users WHERE role='admin'").first<{cnt:number}>();
  if (row && row.cnt > 0) return c.json({ error: "Admin already exists. Use change-password to update credentials." }, 409);
  const { username, email, password } = await c.req.json();
  if (!username || !email || !password) return c.json({ error: "username, email, and password required" }, 400);
  const hash = await hashPassword(password);
  const id = crypto.randomUUID();
  await c.env.DB.prepare(
    "INSERT INTO users (id,username,email,password_hash,role,is_active) VALUES (?,?,?,?,'admin',1)"
  ).bind(id, username, email, hash).run();
  await writeAudit(c.env.DB, username, "auth.setup_admin", "auth", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json({ message: "Admin account created", id });
});

export default auth;
