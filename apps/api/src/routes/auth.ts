import { Hono } from "hono";
import { getSupabase, type Env } from "../lib/supabase.ts";
import { signToken, verifyToken, hashPassword, verifyPassword } from "../lib/auth.ts";
import { writeAudit } from "../lib/audit.ts";

const auth = new Hono<{ Bindings: Env }>();

auth.post("/api/auth/login", async (c) => {
  const { username, password } = await c.req.json();
  if (!username || !password) return c.json({ error: "Missing credentials" }, 400);

  const db = getSupabase(c.env);
  const { data: user } = await db
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("is_active", true)
    .single();

  if (!user) return c.json({ error: "Unauthorized", message: "Invalid credentials" }, 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return c.json({ error: "Unauthorized", message: "Invalid credentials" }, 401);

  const token = await signToken({ id: user.id, username: user.username, role: user.role }, c.env);
  await db.from("users").update({ last_login: new Date().toISOString() }).eq("id", user.id);
  await writeAudit(db, username, "auth.login", "auth", c.req.header("CF-Connecting-IP") ?? "unknown");

  return c.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.created_at },
  });
});

auth.post("/api/auth/logout", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (token) {
    const payload = await verifyToken(token, c.env);
    if (payload) {
      const db = getSupabase(c.env);
      await writeAudit(db, payload.username, "auth.logout", "auth", c.req.header("CF-Connecting-IP") ?? "unknown");
    }
  }
  return c.json({ message: "Logged out" });
});

auth.get("/api/auth/me", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return c.json({ error: "Unauthorized" }, 401);
  const payload = await verifyToken(token, c.env);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);

  const db = getSupabase(c.env);
  const { data: user } = await db.from("users").select("id,username,email,role,created_at").eq("id", payload.id).single();
  if (!user) return c.json({ error: "Not found" }, 404);
  return c.json({ id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.created_at });
});

auth.post("/api/auth/setup-admin", async (c) => {
  // One-time admin setup — disabled if admin already exists
  const db = getSupabase(c.env);
  const { count } = await db.from("users").select("*", { count: "exact", head: true }).eq("role", "admin");
  if (count && count > 0) return c.json({ error: "Admin already exists" }, 409);

  const { username, email, password } = await c.req.json();
  const hash = await hashPassword(password);
  const { data, error } = await db.from("users").insert({
    username, email, password_hash: hash, role: "admin", is_active: true,
  }).select().single();
  if (error) return c.json({ error: error.message }, 500);
  return c.json({ message: "Admin created", id: data.id });
});

export default auth;
