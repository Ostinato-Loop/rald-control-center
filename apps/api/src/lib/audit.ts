import type { SupabaseClient } from "@supabase/supabase-js";

export async function writeAudit(
  db: SupabaseClient,
  username: string,
  action: string,
  resource: string,
  ip: string,
  metadata?: Record<string, unknown>
) {
  await db.from("audit_logs").insert({
    username,
    action,
    resource,
    ip_address: ip,
    metadata: metadata ?? null,
  });
}
