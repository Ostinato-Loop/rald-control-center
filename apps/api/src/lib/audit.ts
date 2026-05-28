export async function writeAudit(
  db: D1Database,
  username: string,
  action: string,
  resource: string,
  ip: string,
  metadata?: Record<string, unknown>
) {
  await db
    .prepare("INSERT INTO audit_logs (id, username, action, resource, ip_address, metadata) VALUES (lower(hex(randomblob(16))),?,?,?,?,?)")
    .bind(username, action, resource, ip, metadata ? JSON.stringify(metadata) : null)
    .run().catch(() => {});
}
