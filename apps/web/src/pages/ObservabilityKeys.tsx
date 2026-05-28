import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Eye, EyeOff, CheckCircle, XCircle, RefreshCw, Save, Trash2, Zap } from "lucide-react";

interface ObsKey {
  id: string;
  service: string;
  label: string;
  is_active: boolean;
  hasKey: boolean;
  last_tested_at: string | null;
  last_test_ok: boolean | null;
  updated_at: string;
  updated_by: string | null;
  endpoint: string | null;
}

const SERVICE_META: Record<string, { color: string; docs: string; fields: { name: string; key: string; placeholder: string; label: string }[] }> = {
  betterstack: {
    color: "#FF6154",
    docs: "https://betterstack.com/docs/logs/source-tokens",
    fields: [
      { name: "source_token", key: "source_token", placeholder: "bt_xxxxxxxxxxxxxxxx", label: "Source Token (Logs)" },
    ],
  },
  betterstack_uptime: {
    color: "#FF6154",
    docs: "https://betterstack.com/docs/uptime/api",
    fields: [
      { name: "api_key", key: "api_key", placeholder: "api_key_xxxxxxxx", label: "Uptime API Key" },
    ],
  },
  posthog: {
    color: "#F54E00",
    docs: "https://posthog.com/docs/api",
    fields: [
      { name: "api_key", key: "api_key", placeholder: "phx_xxxxxxxxxxxxxxxx", label: "Personal API Key" },
      { name: "endpoint", key: "endpoint", placeholder: "https://app.posthog.com", label: "Host (eu.posthog.com for EU cloud)" },
    ],
  },
  sentry: {
    color: "#FB4226",
    docs: "https://docs.sentry.io/api/auth",
    fields: [
      { name: "dsn", key: "dsn", placeholder: "https://xxx@oyyy.ingest.sentry.io/zzz", label: "DSN (for SDK)" },
      { name: "api_key", key: "api_key", placeholder: "sntrys_xxxxxxxxxxxxxxxx", label: "Auth Token (for API)" },
    ],
  },
  resend: {
    color: "#2ECFA3",
    docs: "https://resend.com/docs/api-reference/introduction",
    fields: [
      { name: "api_key", key: "api_key", placeholder: "re_xxxxxxxxxxxxxxxx", label: "API Key" },
    ],
  },
  cloudflare: {
    color: "#F48120",
    docs: "https://developers.cloudflare.com/api/tokens",
    fields: [
      { name: "api_key", key: "api_key", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxx", label: "API Token" },
    ],
  },
  github: {
    color: "#F0F6FC",
    docs: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
    fields: [
      { name: "api_key", key: "api_key", placeholder: "github_pat_xxxxxxxxxxxxxxxx", label: "Personal Access Token" },
    ],
  },
  termii: {
    color: "#6366F1",
    docs: "https://developers.termii.com",
    fields: [
      { name: "api_key", key: "api_key", placeholder: "TLxxxxxxxxxxxxxxxx", label: "API Key" },
    ],
  },
};

export default function ObservabilityKeys() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const { data: keys = [], isLoading } = useQuery<ObsKey[]>({
    queryKey: ["obs-keys"],
    queryFn: () => api.get<ObsKey[]>("/api/observability-keys"),
  });

  const save = useMutation({
    mutationFn: ({ service, values }: { service: string; values: Record<string, string> }) =>
      api.put(`/api/observability-keys/${service}`, values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["obs-keys"] }); setEditing(null); setFormValues({}); },
  });

  const revoke = useMutation({
    mutationFn: (service: string) => api.delete(`/api/observability-keys/${service}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["obs-keys"] }),
  });

  const test = useMutation({
    mutationFn: (service: string) => api.post<{ ok: boolean; message: string }>(`/api/observability-keys/${service}/test`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["obs-keys"] }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-[var(--cyan)] font-mono animate-pulse">Loading keys...</div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)] font-mono">Observability Keys</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Manage API keys for BetterStack, PostHog, Sentry, and other integrations. Keys are stored encrypted — values are never displayed after saving.</p>
      </div>

      <div className="grid gap-4">
        {keys.map((key) => {
          const meta = SERVICE_META[key.service];
          const isOpen = editing === key.service;
          return (
            <div key={key.service} className="rounded-xl border border-[var(--border)] overflow-hidden" style={{ background: "var(--surface)" }}>
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta?.color ?? "#475569", boxShadow: `0 0 8px ${meta?.color ?? "#475569"}80` }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[var(--text)]">{key.label}</span>
                    {key.hasKey ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: "rgba(34,197,94,0.12)", color: "#22C55E" }}>KEY SET</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}>NOT CONFIGURED</span>
                    )}
                    {key.last_tested_at && (
                      key.last_test_ok
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        : <XCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    {key.updated_by ? `Updated by ${key.updated_by} · ${new Date(key.updated_at).toLocaleDateString()}` : "Never configured"}
                    {meta?.docs && <a href={meta.docs} target="_blank" rel="noreferrer" className="ml-2 text-[var(--cyan)] hover:underline">Docs ↗</a>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {key.hasKey && (
                    <button
                      onClick={() => test.mutate(key.service)}
                      disabled={test.isPending}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors"
                      style={{ background: "rgba(0,229,255,0.08)", color: "var(--cyan)", border: "1px solid rgba(0,229,255,0.2)" }}
                      title="Test connectivity"
                    >
                      <Zap className="w-3 h-3" />Test
                    </button>
                  )}
                  {key.hasKey && (
                    <button
                      onClick={() => { if (confirm(`Revoke ${key.label} key?`)) revoke.mutate(key.service); }}
                      className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-400 transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => { setEditing(isOpen ? null : key.service); setFormValues({}); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    style={{ background: isOpen ? "rgba(0,229,255,0.15)" : "rgba(255,255,255,0.05)", color: isOpen ? "var(--cyan)" : "var(--muted)", border: "1px solid var(--border)" }}
                  >
                    {isOpen ? "Cancel" : key.hasKey ? "Rotate Key" : "Add Key"}
                  </button>
                </div>
              </div>

              {isOpen && meta && (
                <div className="px-5 pb-5 pt-0 border-t border-[var(--border)]" style={{ background: "rgba(0,0,0,0.2)" }}>
                  <div className="pt-4 space-y-3">
                    {meta.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-xs text-[var(--muted)] mb-1.5 uppercase tracking-wider font-mono">{field.label}</label>
                        <div className="relative">
                          <input
                            type={showValues[field.key] ? "text" : "password"}
                            className="input font-mono text-sm pr-10 w-full"
                            placeholder={field.placeholder}
                            value={formValues[field.key] ?? ""}
                            onChange={e => setFormValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            onClick={() => setShowValues(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
                          >
                            {showValues[field.key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => save.mutate({ service: key.service, values: formValues })}
                        disabled={save.isPending || Object.values(formValues).every(v => !v)}
                        className="btn btn-primary flex items-center gap-1.5 text-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {save.isPending ? "Saving..." : "Save Key"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
