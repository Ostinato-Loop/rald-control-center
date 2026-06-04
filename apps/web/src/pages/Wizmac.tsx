import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { RefreshCw, CheckCircle, AlertTriangle, XCircle, Activity, Shield, MessageCircle, Search, Bell, InboxIcon, Radio } from "lucide-react";

interface ServiceStatus {
  name: string; label: string; layer: string; domain: string;
  status: "healthy" | "degraded" | "down";
  latency_ms: number; http_code: number; error?: string; checked_at: string;
}
interface WizmacStatus {
  summary: { total: number; healthy: number; degraded: number; down: number; overall: string; checked_at: string };
  by_layer: Record<string, { total: number; healthy: number; down: number }>;
  services: ServiceStatus[];
}

const LAYER_ICONS: Record<string, typeof Activity> = {
  identity: Shield, community: MessageCircle, platform: Activity,
};
const SERVICE_ICONS: Record<string, typeof Activity> = {
  "rald-auth": Shield, "rald-auth-ui": Shield, "loop-api": Activity,
  "messenger": MessageCircle, "rald-notify": Bell,
  "rald-search": Search, "rald-inbox": InboxIcon, "rald-realtime": Radio,
};

function StatusIcon({ status }: { status: string }) {
  if (status === "healthy")  return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  if (status === "degraded") return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  return <XCircle className="w-4 h-4 text-red-400" />;
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    healthy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    degraded: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    down:    "bg-red-500/10 text-red-400 border-red-500/20",
    critical:"bg-red-500/20 text-red-300 border-red-400/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styles[status] ?? styles.down}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default function Wizmac() {
  const { data, isLoading, refetch, isFetching, error } = useQuery<WizmacStatus>({
    queryKey: ["wizmac-status"],
    queryFn: () => api.get("/admin/status"),
    refetchInterval: 30_000,
  });

  const overallColor = data?.summary.overall === "healthy" ? "text-emerald-400"
    : data?.summary.overall === "degraded" ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">WIZMAC</h1>
          <p className="text-xs text-[var(--muted)] font-mono mt-0.5">admin.rald.cloud · RALD Foundation Operations Dashboard</p>
        </div>
        <button onClick={() => refetch()} className="btn btn-ghost text-xs" disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {isLoading && <div className="text-[var(--muted)] font-mono animate-pulse text-sm">Probing all services...</div>}
      {error && <div className="card border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 font-mono">Failed to fetch status. Check authentication.</div>}

      {data && (
        <>
          <div className={`card border p-4 flex items-center gap-4 ${
            data.summary.overall === "healthy"  ? "border-emerald-500/20 bg-emerald-500/5"
            : data.summary.overall === "degraded" ? "border-amber-500/20 bg-amber-500/5"
            : "border-red-500/20 bg-red-500/5"}`}>
            <StatusIcon status={data.summary.overall} />
            <div className="flex-1">
              <div className={`text-sm font-bold font-mono ${overallColor}`}>SYSTEM {data.summary.overall.toUpperCase()}</div>
              <div className="text-xs text-[var(--muted)] mt-0.5">
                {data.summary.healthy}/{data.summary.total} services healthy
                {data.summary.degraded > 0 && ` · ${data.summary.degraded} degraded`}
                {data.summary.down > 0 && ` · ${data.summary.down} down`}
              </div>
            </div>
            <div className="text-xs text-[var(--muted)] font-mono">{new Date(data.summary.checked_at).toLocaleTimeString()}</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(data.by_layer).map(([layer, info]) => {
              const Icon = LAYER_ICONS[layer] ?? Activity;
              return (
                <div key={layer} className="card p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-[var(--cyan)]" />
                    <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider">{layer}</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-[var(--text)]">{info.healthy}/{info.total}</div>
                  <div className="text-xs text-[var(--muted)]">{info.down > 0 ? `${info.down} down` : "all healthy"}</div>
                </div>
              );
            })}
          </div>

          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-semibold text-[var(--text)]">Service Health</h2>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {data.services.map((svc) => {
                const Icon = SERVICE_ICONS[svc.name] ?? Activity;
                return (
                  <div key={svc.name} className="px-4 py-3 flex items-center gap-4 hover:bg-[var(--surface-hover)] transition-colors">
                    <Icon className="w-4 h-4 text-[var(--muted)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[var(--text)]">{svc.label}</div>
                      <div className="text-xs text-[var(--muted)] font-mono truncate">{svc.domain}</div>
                    </div>
                    <div className="text-xs text-[var(--muted)] font-mono w-16 text-right">
                      {svc.latency_ms > 0 ? `${svc.latency_ms}ms` : "—"}
                    </div>
                    <div className="w-20 flex justify-end"><StatusPill status={svc.status} /></div>
                    {svc.error && <div className="text-xs text-red-400 font-mono max-w-[200px] truncate" title={svc.error}>{svc.error}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4 border border-[var(--border)]">
            <h3 className="text-xs font-mono font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">Authentication Health</h3>
            <div className="space-y-2">
              {["rald-auth","rald-auth-ui"].map(name => {
                const svc = data.services.find(s => s.name === name);
                if (!svc) return null;
                return (
                  <div key={name} className="flex items-center gap-3 text-sm">
                    <StatusIcon status={svc.status} />
                    <span className="text-[var(--text)]">{svc.label}</span>
                    <span className="text-[var(--muted)] font-mono text-xs">{svc.domain}</span>
                    <StatusPill status={svc.status} />
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-[var(--muted)] font-mono">Cross-app SSO requires both Identity services to be healthy.</div>
          </div>
        </>
      )}
    </div>
  );
}
