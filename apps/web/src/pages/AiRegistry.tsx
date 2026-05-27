import { useQuery } from "@tanstack/react-query";
import { api, type AiModel } from "@/lib/api";
import { BookOpen } from "lucide-react";

export default function AiRegistry() {
  const { data, isLoading } = useQuery<AiModel[]>({
    queryKey: ["ai-registry"],
    queryFn: () => api.get("/ai-registry"),
  });

  if (isLoading) return <div className="text-[var(--muted)] font-mono animate-pulse">Loading registry...</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold flex items-center gap-2"><BookOpen className="w-5 h-5 text-[var(--cyan)]" /> AI Model Registry</h1>
      <div className="card p-0 overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Model</th>
              <th>Capabilities</th>
              <th>Context</th>
              <th>Cost/1K</th>
              <th>Latency</th>
              <th>Priority</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).length === 0 ? (
              <tr><td colSpan={7} className="text-center text-[var(--muted)] py-8">No models registered yet. Add models via AI Providers.</td></tr>
            ) : (data ?? []).map(m => (
              <tr key={m.id}>
                <td className="font-mono text-[var(--cyan)]">{m.model_name}</td>
                <td><div className="flex flex-wrap gap-1">{(m.capabilities ?? []).map(c => <span key={c} className="badge badge-purple">{c}</span>)}</div></td>
                <td className="font-mono">{(m.context_window ?? 0).toLocaleString()}</td>
                <td className="font-mono text-[var(--amber)]">${m.avg_cost_per_1k ?? 0}</td>
                <td className="font-mono">{m.avg_latency_ms ?? 0}ms</td>
                <td className="font-mono text-[var(--cyan)]">#{m.routing_priority}</td>
                <td><span className={`badge ${m.is_active ? "badge-green" : "badge-gray"}`}>{m.is_active ? "active" : "inactive"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
