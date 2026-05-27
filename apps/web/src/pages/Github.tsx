import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type GithubRepo } from "@/lib/api";
import { Github, RefreshCw, ExternalLink, Star, GitBranch, AlertCircle } from "lucide-react";
import { useState } from "react";

const CATEGORIES = ["All", "AI Services", "Commerce", "Payments", "Voice Systems", "Infrastructure", "Messaging", "Developer Tools", "Security", "Other"];

const catColors: Record<string, string> = {
  "AI Services": "badge-purple", "Commerce": "badge-cyan", "Payments": "badge-green",
  "Voice Systems": "badge-amber", "Infrastructure": "badge-gray", "Messaging": "badge-cyan",
  "Developer Tools": "badge-gray", "Security": "badge-red", "Other": "badge-gray",
};

export default function Github() {
  const qc = useQueryClient();
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");

  const { data: repos, isLoading } = useQuery<GithubRepo[]>({
    queryKey: ["github-repos"],
    queryFn: () => api.get("/github/repos"),
  });

  const sync = useMutation({
    mutationFn: () => api.post<{ synced: number }>("/github/sync"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["github-repos"] }),
  });

  const filtered = (repos ?? []).filter(r =>
    (cat === "All" || r.category === cat) &&
    (r.name.toLowerCase().includes(search.toLowerCase()) || (r.description ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Github className="w-5 h-5" /> GitHub — Ostinato-Loop</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">{repos?.length ?? 0} repositories discovered</p>
        </div>
        <button onClick={() => sync.mutate()} disabled={sync.isPending} className="btn btn-primary text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${sync.isPending ? "animate-spin" : ""}`} />
          {sync.isPending ? "Syncing..." : "Sync All"}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input className="input" style={{ maxWidth: 220 }} placeholder="Search repos..." value={search} onChange={e => setSearch(e.target.value)} />
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} className={`btn text-xs ${cat === c ? "btn-primary" : "btn-ghost"}`}>{c}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-[var(--muted)] font-mono animate-pulse">Loading repositories...</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(r => (
            <div key={r.id} className="card hover:border-[rgba(0,229,255,0.3)] transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <a href={r.url} target="_blank" rel="noopener" className="text-sm font-semibold text-[var(--cyan)] hover:underline flex items-center gap-1">
                    {r.name} <ExternalLink className="w-3 h-3" />
                  </a>
                  <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{r.description ?? "No description"}</p>
                </div>
                {r.isPrivate && <span className="badge badge-gray flex-shrink-0">private</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className={`badge ${catColors[r.category] ?? "badge-gray"}`}>{r.category}</span>
                <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                  {r.language && <span className="font-mono">{r.language}</span>}
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{r.stars}</span>
                  <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />{r.openIssues}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
