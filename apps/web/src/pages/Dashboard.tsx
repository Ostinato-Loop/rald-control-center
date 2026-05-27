import { useQuery } from "@tanstack/react-query";
import { api, type DashboardSummary } from "@/lib/api";
import { StatCard } from "@/components/shared/StatCard";
import { Brain, Github, Globe, Server, DollarSign, Zap, Activity, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: () => api.get("/dashboard/summary"),
    refetchInterval: 60_000,
  });

  if (isLoading) return <div className="text-[var(--muted)] font-mono animate-pulse">Loading dashboard data...</div>;

  const d = data!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">Command Overview</h1>
          <p className="text-xs text-[var(--muted)] font-mono mt-0.5">RALD AI OS · Control Plane</p>
        </div>
        <button onClick={() => refetch()} className="btn btn-ghost text-xs" disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active AI Providers" value={d.activeProviders} icon={Brain} accent="purple" />
        <StatCard label="Active Models" value={d.activeModels} icon={Zap} accent="cyan" />
        <StatCard label="Language Packs" value={d.activeLanguages} icon={Globe} accent="green" />
        <StatCard label="Total AI Cost" value={`$${d.aiCosts.totalCostUsd.toLocaleString("en", { maximumFractionDigits: 0 })}`} icon={DollarSign} accent="amber" sub={`$${d.aiCosts.last7Days.toFixed(0)} last 7d`} />
      </div>

      {/* Two columns */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* GitHub */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Github className="w-4 h-4 text-[var(--cyan)]" />
            <span className="font-semibold text-sm">GitHub — Ostinato-Loop</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Total Repos", d.githubStats.totalRepos],
              ["AI Repos", d.githubStats.aiRepos],
              ["Total Stars", d.githubStats.totalStars],
              ["Open Issues", d.githubStats.totalOpenIssues],
            ].map(([k, v]) => (
              <div key={String(k)} className="p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                <div className="text-lg font-bold text-[var(--cyan)] font-mono">{v}</div>
                <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-0.5">{k}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1.5">
            {Object.entries(d.githubStats.categories).slice(0, 5).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="text-[var(--muted)]">{cat}</span>
                <span className="font-mono text-[var(--text)]">{count} repos</span>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-[var(--cyan)]" />
            <span className="font-semibold text-sm">Infrastructure Health</span>
            <span className={`ml-auto badge ${d.infrastructure.overall === "healthy" ? "badge-green" : "badge-amber"}`}>
              {d.infrastructure.overall}
            </span>
          </div>
          <div className="space-y-2">
            {d.infrastructure.services.map(s => (
              <div key={s.name} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.status === "operational" ? "bg-[var(--green)]" : "bg-[var(--amber)]"}`} style={s.status === "operational" ? { boxShadow: "0 0 6px var(--green)" } : {}} />
                  <span className="text-sm">{s.name}</span>
                </div>
                <span className={`text-xs font-mono ${s.status === "operational" ? "text-[var(--green)]" : "text-[var(--amber)]"}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Cost breakdown */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[var(--purple)]" />
          <span className="font-semibold text-sm">AI Cost by Provider</span>
          <span className="ml-auto text-xs text-[var(--muted)] font-mono">{d.aiCosts.totalTokens.toLocaleString()} total tokens</span>
        </div>
        <div className="space-y-2">
          {d.aiCosts.byProvider.map(p => {
            const pct = d.aiCosts.totalCostUsd > 0 ? (p.costUsd / d.aiCosts.totalCostUsd) * 100 : 0;
            return (
              <div key={p.provider} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{p.provider}</span>
                  <span className="font-mono text-[var(--amber)]">${p.costUsd.toFixed(2)} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--purple)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent audit */}
      <div className="card">
        <h2 className="font-semibold text-sm mb-4">Recent Activity</h2>
        <div className="space-y-1.5">
          {d.recentAudit.slice(0, 8).map(log => (
            <div key={log.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-[rgba(30,58,95,0.4)] last:border-0">
              <span className="font-mono text-[var(--cyan)] w-28 truncate">{log.action}</span>
              <span className="text-[var(--muted)]">{log.username}</span>
              <span className="text-[var(--muted)]">{log.resource}</span>
              <span className="ml-auto text-[var(--muted)] font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
