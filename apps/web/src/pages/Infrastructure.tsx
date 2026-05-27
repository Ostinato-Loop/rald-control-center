import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Server, RefreshCw } from "lucide-react";

type InfraHealth = { overall: string; services: { name: string; status: string }[]; checkedAt: string };

export default function Infrastructure() {
  const { data, isLoading, refetch, isFetching } = useQuery<InfraHealth>({
    queryKey: ["infra-health"],
    queryFn: () => api.get("/infrastructure/health"),
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2"><Server className="w-5 h-5 text-[var(--cyan)]" /> Infrastructure</h1>
        <button onClick={() => refetch()} className="btn btn-ghost text-xs" disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-[var(--muted)] font-mono animate-pulse">Checking services...</div>
      ) : data && (
        <>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${data.overall === "healthy" ? "bg-[var(--green)]" : "bg-[var(--amber)]"}`}
              style={data.overall === "healthy" ? { boxShadow: "0 0 8px var(--green)" } : {}} />
            <span className="font-mono font-semibold uppercase tracking-wider text-sm" style={{ color: data.overall === "healthy" ? "var(--green)" : "var(--amber)" }}>
              {data.overall}
            </span>
            <span className="text-xs text-[var(--muted)] font-mono ml-2">checked {new Date(data.checkedAt).toLocaleTimeString()}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {data.services.map(s => (
              <div key={s.name} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.status === "operational" ? "bg-[var(--green)]" : s.status === "degraded" ? "bg-[var(--amber)]" : "bg-[var(--red)]"}`} />
                  <span className="font-medium text-sm">{s.name}</span>
                </div>
                <span className={`badge ${s.status === "operational" ? "badge-green" : s.status === "degraded" ? "badge-amber" : "badge-red"}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
