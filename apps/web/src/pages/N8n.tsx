import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Workflow, AlertCircle } from "lucide-react";

export default function N8n() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["n8n-workflows"],
    queryFn: () => api.get<{ data: Record<string, unknown>[] }>("/n8n/workflows"),
    retry: false,
  });

  const { data: execs } = useQuery({
    queryKey: ["n8n-executions"],
    queryFn: () => api.get<{ data: Record<string, unknown>[] }>("/n8n/executions"),
    retry: false,
  });

  const workflows = data?.data ?? [];
  const executions = execs?.data ?? [];
  const active = workflows.filter((w: Record<string, unknown>) => w.active).length;
  const succeeded = executions.filter((e: Record<string, unknown>) => e.status === "success").length;
  const failed = executions.filter((e: Record<string, unknown>) => e.status === "error").length;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold flex items-center gap-2"><Workflow className="w-5 h-5 text-[var(--cyan)]" /> n8n Orchestration</h1>

      {isError && (
        <div className="flex items-center gap-2 p-4 rounded-xl text-sm" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <AlertCircle className="w-4 h-4 text-[var(--amber)]" />
          <span className="text-[var(--amber)]">Cannot reach n8n. Check N8N_URL and N8N_API_KEY in Cloudflare Worker secrets.</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Total Workflows", workflows.length, "var(--cyan)"],
          ["Active", active, "var(--green)"],
          ["Executions", executions.length, "var(--purple)"],
          ["Failed", failed, "var(--red)"],
        ].map(([label, val, color]) => (
          <div key={String(label)} className="stat-card">
            <div className="stat-value" style={{ color: String(color) }}>{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {workflows.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table>
            <thead><tr><th>Workflow</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {workflows.map((w: Record<string, unknown>) => (
                <tr key={String(w.id)}>
                  <td className="font-medium">{String(w.name)}</td>
                  <td><span className={`badge ${w.active ? "badge-green" : "badge-gray"}`}>{w.active ? "active" : "inactive"}</span></td>
                  <td className="font-mono text-xs text-[var(--muted)]">{String(w.updatedAt ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
