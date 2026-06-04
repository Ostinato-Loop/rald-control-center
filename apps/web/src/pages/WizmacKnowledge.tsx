// WIZMAC Knowledge Core — Structured Registry UI
// Phase 1: All 10 registries — Vision, Products, Domains, Architecture,
//           Identity, Operations, Planning, Incidents, Regional, Documentation
// The institutional memory of RALD — admin.rald.cloud | LILCKY STUDIO LIMITED

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

// ── Registry configuration ────────────────────────────────────────────────────
const REGISTRIES = [
  { id: "vision",        label: "Vision Registry",        icon: "🌍", color: "#2EB67D", description: "Why RALD exists. Mission, principles, design philosophy." },
  { id: "products",      label: "Product Registry",       icon: "📦", color: "#4A90D9", description: "Every product, its purpose, owner, status, and dependencies." },
  { id: "domains",       label: "Domain Registry",        icon: "🌐", color: "#7C3AED", description: "Every domain in the ecosystem — owner, status, health." },
  { id: "architecture",  label: "Architecture Registry",  icon: "🏗️",  color: "#F59E0B", description: "Service maps, infra, databases, Cloudflare topology." },
  { id: "identity",      label: "Identity Registry",      icon: "🔐", color: "#EC4899", description: "SSO, sessions, JWT, connected apps. One identity for all." },
  { id: "operations",    label: "Operations Registry",    icon: "⚡", color: "#10B981", description: "CI/CD, deployments, health, error rates, uptime." },
  { id: "planning",      label: "Weekly Planning",        icon: "📅", color: "#F97316", description: "P0/P1/P2 priorities. No random development." },
  { id: "incidents",     label: "Incident Registry",      icon: "🚨", color: "#EF4444", description: "Every production issue. Root cause, fix, lessons learned." },
  { id: "regional",      label: "Regional Expansion",     icon: "🗺️",  color: "#8B5CF6", description: "Nigeria, Ghana, Kenya, South Africa. Languages, launch status, growth." },
  { id: "documentation", label: "Documentation Registry", icon: "📚", color: "#06B6D4", description: "API contracts, onboarding, architecture docs." },
] as const;

type RegistryId = typeof REGISTRIES[number]["id"];

interface KnowledgeEntry {
  id: string;
  registry: string;
  title: string;
  content: Record<string, unknown> | string;
  status: string;
  priority: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

// ── Content renderers per registry type ──────────────────────────────────────
function VisionCard({ content }: { content: any }) {
  return (
    <div className="space-y-2">
      {content.category && <span className="text-xs font-mono uppercase tracking-widest" style={{ color: "#2EB67D" }}>{content.category}</span>}
      <p className="text-sm leading-relaxed" style={{ color: "#C9D1D9" }}>{content.text}</p>
    </div>
  );
}

function ProductCard({ content }: { content: any }) {
  const statusColors: Record<string, string> = { production: "#2EB67D", planned: "#F59E0B", deprecated: "#EF4444" };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: `${statusColors[content.status?.toLowerCase()] ?? "#8896A8"}22`, color: statusColors[content.status?.toLowerCase()] ?? "#8896A8", border: `1px solid ${statusColors[content.status?.toLowerCase()] ?? "#8896A8"}44` }}>{content.status?.toUpperCase()}</span>
        {content.domain && <span className="text-xs font-mono" style={{ color: "#5A6A7A" }}>{content.domain}</span>}
        {content.phase && <span className="text-xs" style={{ color: "#8896A8" }}>{content.phase}</span>}
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "#C9D1D9" }}>{content.purpose || content.description}</p>
      {content.dependencies?.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {content.dependencies.map((d: string) => (
            <span key={d} className="text-xs px-2 py-0.5 rounded" style={{ background: "#161B22", border: "1px solid #21262D", color: "#8896A8" }}>↳ {d}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function DomainCard({ content }: { content: any }) {
  const statusColor = content.status === "active" ? "#2EB67D" : "#EF4444";
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
        <span className="text-xs font-mono" style={{ color: statusColor }}>{content.status?.toUpperCase()}</span>
        {content.product && <span className="text-xs" style={{ color: "#5A6A7A" }}>→ {content.product}</span>}
      </div>
      <p className="text-sm" style={{ color: "#C9D1D9" }}>{content.purpose}</p>
      {content.health_endpoint && (
        <a href={content.health_endpoint} target="_blank" rel="noopener noreferrer" className="text-xs font-mono hover:underline" style={{ color: "#4A90D9" }}>{content.health_endpoint}</a>
      )}
      {content.notes && <p className="text-xs italic" style={{ color: "#5A6A7A" }}>{content.notes}</p>}
    </div>
  );
}

function ArchitectureCard({ content }: { content: any }) {
  return (
    <div className="space-y-3">
      {content.description && <p className="text-sm" style={{ color: "#C9D1D9" }}>{content.description}</p>}
      {content.critical_path && (
        <div>
          <span className="text-xs font-mono uppercase" style={{ color: "#EF4444" }}>Critical Path</span>
          {content.critical_path.map((p: string, i: number) => (
            <p key={i} className="text-xs mt-1 font-mono" style={{ color: "#F59E0B" }}>⚠ {p}</p>
          ))}
        </div>
      )}
      {content.layers && Object.entries(content.layers).map(([layer, services]) => (
        <div key={layer}>
          <span className="text-xs font-mono uppercase" style={{ color: "#8896A8" }}>{layer}</span>
          <div className="flex gap-1 flex-wrap mt-1">
            {(services as string[]).map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: "#161B22", border: "1px solid #21262D", color: "#C9D1D9" }}>{s}</span>
            ))}
          </div>
        </div>
      ))}
      {content.critical_flaw && <p className="text-xs p-2 rounded" style={{ background: "#EF444411", border: "1px solid #EF444433", color: "#EF4444" }}>⚠ {content.critical_flaw}</p>}
    </div>
  );
}

function IncidentCard({ content }: { content: any }) {
  const severityColors: Record<string, string> = { P0: "#EF4444", P1: "#F59E0B", P2: "#8896A8", P3: "#8896A8" };
  const statusColors: Record<string, string> = { ROOT_CAUSE_IDENTIFIED: "#F59E0B", RESOLVED: "#2EB67D", OPEN: "#EF4444", INVESTIGATING: "#4A90D9" };
  const sev = content.severity ?? "P3";
  const stat = content.status ?? "OPEN";
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded font-mono font-bold" style={{ background: `${severityColors[sev]}22`, color: severityColors[sev], border: `1px solid ${severityColors[sev]}44` }}>{sev}</span>
        <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: `${statusColors[stat] ?? "#8896A8"}22`, color: statusColors[stat] ?? "#8896A8", border: `1px solid ${statusColors[stat] ?? "#8896A8"}44` }}>{stat}</span>
      </div>
      {content.impact && <p className="text-sm" style={{ color: "#C9D1D9" }}><span style={{ color: "#EF4444" }}>Impact:</span> {content.impact}</p>}
      {content.root_cause && <p className="text-sm" style={{ color: "#C9D1D9" }}><span style={{ color: "#F59E0B" }}>Root Cause:</span> {content.root_cause}</p>}
      {content.lessons && (
        <div>
          <span className="text-xs font-mono uppercase" style={{ color: "#8896A8" }}>Lessons Learned</span>
          <ul className="mt-1 space-y-1">
            {content.lessons.map((l: string, i: number) => (
              <li key={i} className="text-xs" style={{ color: "#8896A8" }}>• {l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RegionalCard({ content }: { content: any }) {
  const isActive = content.status?.includes("ACTIVE");
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{content.flag}</span>
        <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: isActive ? "#2EB67D22" : "#8896A822", color: isActive ? "#2EB67D" : "#8896A8", border: `1px solid ${isActive ? "#2EB67D" : "#8896A8"}44` }}>{content.status}</span>
      </div>
      {content.languages && (
        <div className="flex gap-1 flex-wrap">
          {content.languages.map((l: string) => (
            <span key={l} className="text-xs px-2 py-0.5 rounded" style={{ background: "#161B22", border: "1px solid #21262D", color: "#8896A8" }}>{l}</span>
          ))}
        </div>
      )}
      {content.campus_growth && <p className="text-xs" style={{ color: "#8896A8" }}>🎓 {content.campus_growth}</p>}
    </div>
  );
}

function PlanningCard({ content }: { content: any }) {
  return (
    <div className="space-y-3">
      {content.week && <span className="text-xs font-mono" style={{ color: "#8896A8" }}>Week of {content.week}</span>}
      {content.focus && <p className="text-xs p-2 rounded italic" style={{ background: "#161B22", border: "1px solid #21262D", color: "#F59E0B" }}>Focus: {content.focus}</p>}
      {[["P0", "#EF4444", content.p0], ["P1", "#F59E0B", content.p1], ["P2", "#8896A8", content.p2]].map(([priority, color, items]) =>
        items && (items as string[]).length > 0 ? (
          <div key={priority as string}>
            <span className="text-xs font-mono font-bold" style={{ color: color as string }}>{priority as string}</span>
            <ul className="mt-1 space-y-1">
              {(items as string[]).map((item, i) => (
                <li key={i} className="text-xs" style={{ color: "#C9D1D9" }}>→ {item}</li>
              ))}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}

function GenericCard({ content }: { content: any }) {
  if (typeof content === "string") return <p className="text-sm" style={{ color: "#C9D1D9" }}>{content}</p>;
  return (
    <div className="space-y-2">
      {Object.entries(content).map(([key, value]) => (
        <div key={key}>
          <span className="text-xs font-mono uppercase" style={{ color: "#5A6A7A" }}>{key.replace(/_/g, " ")}</span>
          <div className="mt-0.5">
            {Array.isArray(value) ? (
              <ul className="space-y-0.5">
                {(value as unknown[]).map((v, i) => (
                  <li key={i} className="text-xs" style={{ color: "#8896A8" }}>• {typeof v === "object" ? JSON.stringify(v) : String(v)}</li>
                ))}
              </ul>
            ) : typeof value === "object" && value !== null ? (
              <pre className="text-xs overflow-auto p-2 rounded" style={{ background: "#161B22", color: "#8896A8", maxHeight: 120 }}>{JSON.stringify(value, null, 2)}</pre>
            ) : (
              <p className="text-sm" style={{ color: "#C9D1D9" }}>{String(value)}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ContentCard({ registryId, entry }: { registryId: RegistryId; entry: KnowledgeEntry }) {
  const content = typeof entry.content === "string" ? { text: entry.content } : (entry.content ?? {});
  switch (registryId) {
    case "vision":        return <VisionCard content={content} />;
    case "products":      return <ProductCard content={content} />;
    case "domains":       return <DomainCard content={content} />;
    case "architecture":  return <ArchitectureCard content={content} />;
    case "incidents":     return <IncidentCard content={content} />;
    case "regional":      return <RegionalCard content={content} />;
    case "planning":      return <PlanningCard content={content} />;
    default:              return <GenericCard content={content} />;
  }
}

// ── Create Entry Modal ────────────────────────────────────────────────────────
function CreateEntryModal({ registry, onClose, onCreated }: { registry: typeof REGISTRIES[number]; onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("{}");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    let parsed: unknown;
    try { parsed = JSON.parse(content); } catch { setErr("Content must be valid JSON"); return; }
    setSaving(true);
    try {
      await api.post(`/api/admin/knowledge/${registry.id}`, { title: title.trim(), content: parsed });
      onCreated();
      onClose();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="rounded-lg w-full max-w-lg mx-4 p-6" style={{ background: "#0D1117", border: "1px solid #21262D" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">{registry.icon} New {registry.label} Entry</h3>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: "#5A6A7A" }}>×</button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-xs font-mono uppercase" style={{ color: "#5A6A7A" }}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Entry title..." required
              className="w-full mt-1 px-3 py-2 rounded text-sm" style={{ background: "#161B22", border: "1px solid #21262D", color: "#E6EDF3", outline: "none" }} />
          </div>
          <div>
            <label className="text-xs font-mono uppercase" style={{ color: "#5A6A7A" }}>Content (JSON)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} required
              className="w-full mt-1 px-3 py-2 rounded text-xs font-mono resize-none"
              style={{ background: "#161B22", border: "1px solid #21262D", color: "#E6EDF3", outline: "none" }} />
          </div>
          {err && <p className="text-xs" style={{ color: "#EF4444" }}>{err}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-sm" style={{ background: "#21262D", color: "#8896A8" }}>Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded text-sm font-medium" style={{ background: registry.color, color: "#fff", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : "Create Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Knowledge Core Page ──────────────────────────────────────────────────
export default function WizmacKnowledge() {
  const [activeRegistry, setActiveRegistry] = useState<RegistryId>("vision");
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [migrated, setMigrated] = useState(false);

  const registry = REGISTRIES.find(r => r.id === activeRegistry)!;

  const init = useCallback(async () => {
    try {
      await api.get("/api/admin/knowledge/migrate");
      setMigrated(true);
    } catch { setMigrated(true); }
  }, []);

  const loadCounts = useCallback(async () => {
    try {
      const data = await api.get<{ registries: Record<string, number> }>("/api/admin/knowledge");
      setCounts(data.registries ?? {});
    } catch {}
  }, []);

  const loadEntries = useCallback(async (reg: RegistryId) => {
    setLoading(true);
    try {
      const data = await api.get<{ entries: KnowledgeEntry[] }>(`/api/admin/knowledge/${reg}`);
      setEntries(data.entries ?? []);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { init().then(() => { loadCounts(); loadEntries(activeRegistry); }); }, []);
  useEffect(() => { if (migrated) loadEntries(activeRegistry); }, [activeRegistry, migrated]);

  async function seed() {
    setSeeding(true); setSeedMsg("");
    try {
      const data = await api.post<{ inserted: number; skipped: number; total: number }>("/api/admin/knowledge/seed", {});
      setSeedMsg(`Seeded: ${data.inserted} new entries, ${data.skipped} already existed`);
      await loadCounts();
      await loadEntries(activeRegistry);
    } catch (ex) {
      setSeedMsg(ex instanceof Error ? ex.message : "Seed failed");
    } finally { setSeeding(false); }
  }

  const totalEntries = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-full" style={{ background: "#0D1117", minHeight: "100vh" }}>
      {showCreate && (
        <CreateEntryModal registry={registry} onClose={() => setShowCreate(false)}
          onCreated={() => { loadEntries(activeRegistry); loadCounts(); }} />
      )}

      {/* ── Left Nav ─────────────────────────────────────────────────── */}
      <aside className="flex-shrink-0 w-56 border-r flex flex-col" style={{ borderColor: "#21262D", background: "#0D1117" }}>
        <div className="p-4 border-b" style={{ borderColor: "#21262D" }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🧠</span>
            <span className="font-bold text-sm">Knowledge Core</span>
          </div>
          <p className="text-xs" style={{ color: "#5A6A7A" }}>{totalEntries} entries across {Object.keys(counts).length} registries</p>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {REGISTRIES.map(reg => (
            <button key={reg.id} onClick={() => setActiveRegistry(reg.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm transition-colors"
              style={{
                background: activeRegistry === reg.id ? `${reg.color}18` : "transparent",
                color: activeRegistry === reg.id ? reg.color : "#8896A8",
                border: activeRegistry === reg.id ? `1px solid ${reg.color}33` : "1px solid transparent",
              }}>
              <span>{reg.icon}</span>
              <span className="flex-1 text-xs">{reg.label.replace(" Registry", "").replace(" Planning", "")}</span>
              {counts[reg.id] !== undefined && (
                <span className="text-xs font-mono rounded-full px-1.5" style={{ background: activeRegistry === reg.id ? `${reg.color}33` : "#21262D", color: activeRegistry === reg.id ? reg.color : "#5A6A7A" }}>
                  {counts[reg.id]}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: "#21262D" }}>
          <button onClick={seed} disabled={seeding}
            className="w-full px-3 py-2 rounded text-xs font-medium"
            style={{ background: "#161B22", border: "1px solid #21262D", color: "#8896A8" }}>
            {seeding ? "Seeding..." : "⚡ Seed Canonical Data"}
          </button>
          {seedMsg && <p className="text-xs mt-1" style={{ color: seedMsg.includes("failed") ? "#EF4444" : "#2EB67D" }}>{seedMsg}</p>}
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#21262D" }}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{registry.icon}</span>
              <h2 className="font-bold">{registry.label}</h2>
              <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: `${registry.color}18`, color: registry.color, border: `1px solid ${registry.color}33` }}>
                {entries.length} entries
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#5A6A7A" }}>{registry.description}</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: registry.color, color: "#fff" }}>
            + New Entry
          </button>
        </header>

        {/* Entries grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${registry.color}44`, borderTopColor: registry.color }} />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-center">
              <span className="text-4xl mb-3">{registry.icon}</span>
              <p className="font-medium text-sm mb-1">No entries yet</p>
              <p className="text-xs mb-4" style={{ color: "#5A6A7A" }}>Click "⚡ Seed Canonical Data" to populate with RALD's foundational knowledge, or create a new entry.</p>
              <button onClick={() => setShowCreate(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: registry.color, color: "#fff" }}>
                + Create First Entry
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {entries.map(entry => (
                <article key={entry.id} className="rounded-lg p-4 flex flex-col gap-3"
                  style={{ background: "#161B22", border: `1px solid #21262D` }}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: "#E6EDF3" }}>{entry.title}</h3>
                    <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1`} style={{ background: entry.status === "active" ? "#2EB67D" : "#5A6A7A" }} />
                  </div>
                  <ContentCard registryId={activeRegistry} entry={entry} />
                  <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: "#21262D" }}>
                    <span className="text-xs font-mono" style={{ color: "#5A6A7A" }}>
                      {new Date(entry.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                    {entry.priority > 0 && (
                      <span className="text-xs font-mono ml-auto" style={{ color: registry.color }}>P{10 - entry.priority}</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
