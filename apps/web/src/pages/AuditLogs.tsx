import { useQuery } from "@tanstack/react-query";
import { api, type AuditLog } from "@/lib/api";
import { ScrollText, RefreshCw } from "lucide-react";

export default function AuditLogs() {
  const { data, isLoading, refetch, isFetching } = useQuery<AuditLog[]>({
    queryKey: ["audit-logs"],
    queryFn: () => api.get("/audit?limit=100"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><ScrollText className="w-5 h-5 text-[var(--cyan)]" /> Audit Log</h1>
        <button onClick={() => refetch()} className="btn btn-ghost text-xs" disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>User</th>
              <th>Resource</th>
              <th>IP</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center text-[var(--muted)] py-8">Loading...</td></tr>
            ) : (data ?? []).map(log => (
              <tr key={log.id}>
                <td><span className="font-mono text-xs text-[var(--cyan)]">{log.action}</span></td>
                <td className="font-mono text-sm">{log.username}</td>
                <td><span className="badge badge-gray">{log.resource}</span></td>
                <td className="font-mono text-xs text-[var(--muted)]">{log.ip_address}</td>
                <td className="font-mono text-xs text-[var(--muted)]">{new Date(log.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
