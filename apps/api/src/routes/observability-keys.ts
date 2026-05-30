import { Hono } from "hono";
import { verifyToken } from "../lib/auth.ts";
import { getSupabase, type Env } from "../lib/supabase.ts";
import { writeAudit } from "../lib/audit.ts";

const obs = new Hono<{ Bindings: Env }>();

async function requireAuth(c: any) {
  const tok = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!tok) return null;
  return verifyToken(tok, c.env);
}

// GET all keys (values masked — never return raw keys)
obs.get("/api/observability-keys", async (c) => {
  const payload = await requireAuth(c);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const db = getSupabase(c.env);
  const { data, error } = await db
    .from("rald_cc_observability_keys")
    .select("id,service,label,is_active,last_tested_at,last_test_ok,updated_at,updated_by,endpoint,extra")
    .order("service");
  if (error) return c.json({ error: error.message }, 500);
  // Indicate whether a key is set without exposing it
  const rows = await db.from("rald_cc_observability_keys").select("id,api_key,source_token,dsn");
  const keyMap: Record<string, boolean> = {};
  for (const r of (rows.data ?? []) as { id: string; api_key?: string | null; source_token?: string | null; dsn?: string | null }[]) {
    keyMap[r.id] = !!(r.api_key || r.source_token || r.dsn);
  }
  return c.json((data ?? []).map(r => ({ ...r, hasKey: !!keyMap[r.id] })));
});

// PUT /api/observability-keys/:service — upsert key for a service
obs.put("/api/observability-keys/:service", async (c) => {
  const payload = await requireAuth(c);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const service = c.req.param("service");
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const db = getSupabase(c.env);
  const { api_key, source_token, dsn, endpoint, label, extra } = body as any;
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    updated_by: payload.username,
    is_active: true,
  };
  if (api_key)      update.api_key = api_key;
  if (source_token) update.source_token = source_token;
  if (dsn)          update.dsn = dsn;
  if (endpoint)     update.endpoint = endpoint;
  if (label)        update.label = label;
  if (extra)        update.extra = extra;

  const { data, error } = await db
    .from("rald_cc_observability_keys")
    .upsert({ service, label: label ?? service, ...update }, { onConflict: "service" })
    .select("id,service,label,is_active,updated_at")
    .single();
  if (error) return c.json({ error: error.message }, 500);
  await writeAudit(c.env.DB, payload.username, `obs_key.update.${service}`, "observability_keys", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json({ ok: true, key: data });
});

// DELETE key value only (zero out — don't delete the row)
obs.delete("/api/observability-keys/:service", async (c) => {
  const payload = await requireAuth(c);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const db = getSupabase(c.env);
  const { error } = await db
    .from("rald_cc_observability_keys")
    .update({ api_key: null, source_token: null, dsn: null, is_active: false, updated_by: payload.username, updated_at: new Date().toISOString() })
    .eq("service", c.req.param("service"));
  if (error) return c.json({ error: error.message }, 500);
  await writeAudit(c.env.DB, payload.username, `obs_key.revoke.${c.req.param("service")}`, "observability_keys", c.req.header("CF-Connecting-IP") ?? "unknown");
  return c.json({ ok: true, revoked: true });
});

// POST /api/observability-keys/:service/test — test connectivity
obs.post("/api/observability-keys/:service/test", async (c) => {
  const payload = await requireAuth(c);
  if (!payload) return c.json({ error: "Unauthorized" }, 401);
  const service = c.req.param("service");
  const db = getSupabase(c.env);
  const { data: row } = await db.from("rald_cc_observability_keys").select("*").eq("service", service).single();
  if (!row) return c.json({ error: "Service not configured" }, 404);

  let ok = false;
  let message = "";
  try {
    if (service === "posthog" && row.api_key) {
      const r = await fetch("https://app.posthog.com/api/projects/", { headers: { Authorization: `Bearer ${row.api_key}` } });
      ok = r.status < 400; message = `PostHog: ${r.status}`;
    } else if (service === "sentry" && row.api_key) {
      const r = await fetch("https://sentry.io/api/0/projects/", { headers: { Authorization: `Bearer ${row.api_key}` } });
      ok = r.status < 400; message = `Sentry: ${r.status}`;
    } else if (service === "betterstack" && row.source_token) {
      const r = await fetch("https://in.logs.betterstack.com", { method: "POST", headers: { Authorization: `Bearer ${row.source_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ message: "RALD connection test", service: "rald.cloud" }) });
      ok = r.status < 400; message = `BetterStack: ${r.status}`;
    } else if (service === "resend" && row.api_key) {
      const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${row.api_key}` } });
      ok = r.status < 400; message = `Resend: ${r.status}`;
    } else {
      message = "No key configured or test not available for this service";
    }
  } catch (e: any) { message = e.message; }

  await db.from("rald_cc_observability_keys").update({ last_tested_at: new Date().toISOString(), last_test_ok: ok }).eq("service", service);
  return c.json({ ok, service, message });
});

export default obs;
