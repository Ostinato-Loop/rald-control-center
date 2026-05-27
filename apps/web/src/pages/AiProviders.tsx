import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type AiProvider } from "@/lib/api";
import { Brain, Plus, ToggleLeft, ToggleRight, Trash2, Key } from "lucide-react";
import { useState } from "react";

export default function AiProviders() {
  const qc = useQueryClient();
  const { data: providers, isLoading } = useQuery<AiProvider[]>({
    queryKey: ["ai-providers"],
    queryFn: () => api.get("/ai-providers"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/ai-providers/${id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-providers"] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => api.delete(`/ai-providers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-providers"] }),
  });

  const providerIcons: Record<string, string> = {
    openai: "🤖", anthropic: "🧠", gemini: "✨", deepseek: "🔮", whisper: "🎙️",
  };

  if (isLoading) return <div className="text-[var(--muted)] font-mono animate-pulse">Loading providers...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Brain className="w-5 h-5 text-[var(--purple)]" /> AI Providers</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">Manage AI provider credentials and routing</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Tokens Used</th>
              <th>Cost (USD)</th>
              <th>Requests</th>
              <th>Key</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(providers ?? []).map(p => (
              <tr key={p.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <span>{providerIcons[p.provider_type] ?? "🔗"}</span>
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td><span className="badge badge-gray font-mono">{p.provider_type}</span></td>
                <td><span className="font-mono text-[var(--cyan)]">#{p.routing_priority}</span></td>
                <td className="font-mono">{(p.total_tokens_used ?? 0).toLocaleString()}</td>
                <td className="font-mono text-[var(--amber)]">${Number(p.total_cost_usd ?? 0).toFixed(2)}</td>
                <td className="font-mono">{(p.request_count ?? 0).toLocaleString()}</td>
                <td>
                  <span className={`badge ${p.hasKey ? "badge-green" : "badge-red"}`}>
                    <Key className="w-3 h-3 mr-1" />
                    {p.hasKey ? "set" : "missing"}
                  </span>
                </td>
                <td>
                  <span className={`badge ${p.is_active ? "badge-green" : "badge-gray"}`}>
                    {p.is_active ? "active" : "inactive"}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggle.mutate({ id: p.id, is_active: !p.is_active })}
                      className="text-[var(--muted)] hover:text-[var(--cyan)] transition-colors"
                      title={p.is_active ? "Deactivate" : "Activate"}
                    >
                      {p.is_active ? <ToggleRight className="w-5 h-5 text-[var(--green)]" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete ${p.name}?`)) del.mutate(p.id); }}
                      className="text-[var(--muted)] hover:text-[var(--red)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
