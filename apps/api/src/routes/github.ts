import { Hono } from "hono";
import { verifyToken } from "../lib/auth.ts";
import { getSupabase, type Env } from "../lib/supabase.ts";
import { writeAudit } from "../lib/audit.ts";

const github = new Hono<{ Bindings: Env }>();

const ORG = "Ostinato-Loop";

function classify(repo: { name: string; topics?: string[]; description?: string | null }): string {
  const n = repo.name.toLowerCase();
  const d = (repo.description ?? "").toLowerCase();
  const t = (repo.topics ?? []).join(" ").toLowerCase();
  if (n.includes("ai") || t.includes("ai") || d.includes("artificial")) return "AI Services";
  if (n.includes("pay") || n.includes("wallet") || n.includes("checkout")) return "Payments";
  if (n.includes("loop") && !n.includes("loop-voice")) return "Commerce";
  if (n.includes("voice") || t.includes("voice") || t.includes("speech")) return "Voice Systems";
  if (n.includes("infra") || n.includes("observ") || n.includes("console")) return "Infrastructure";
  if (n.includes("msg") || n.includes("messenger") || n.includes("event")) return "Messaging";
  if (n.includes("sdk") || n.includes("design") || n.includes("shared")) return "Developer Tools";
  if (n.includes("security") || n.includes("auth")) return "Security";
  return "Other";
}

async function ghFetch(path: string, token: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `token ${token}`, "User-Agent": "RALD-Control-Center/1.0" },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

github.get("/api/github/repos", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);

  let page = 1;
  const all: Record<string, unknown>[] = [];
  while (true) {
    const repos: Record<string, unknown>[] = await ghFetch(`/orgs/${ORG}/repos?per_page=100&page=${page}&sort=updated`, c.env.GITHUB_TOKEN) as Record<string, unknown>[];
    if (!repos.length) break;
    all.push(...repos);
    if (repos.length < 100) break;
    page++;
  }

  const enriched = all.map((r: Record<string, unknown>) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    url: r.html_url,
    defaultBranch: r.default_branch,
    isPrivate: r.private,
    stars: r.stargazers_count,
    forks: r.forks_count,
    openIssues: r.open_issues_count,
    language: r.language,
    topics: r.topics,
    category: classify(r as { name: string; topics?: string[]; description?: string | null }),
    pushedAt: r.pushed_at,
    updatedAt: r.updated_at,
    isArchived: r.archived,
  }));

  const db = getSupabase(c.env);
  const payload = await verifyToken(token, c.env);
  await writeAudit(db, payload!.username, "github.list_repos", "github", c.req.header("CF-Connecting-IP") ?? "unknown");

  return c.json(enriched);
});

github.post("/api/github/sync", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);

  const repos: Record<string, unknown>[] = await ghFetch(`/orgs/${ORG}/repos?per_page=100&sort=updated`, c.env.GITHUB_TOKEN) as Record<string, unknown>[];
  const db = getSupabase(c.env);

  const upserts = repos.map((r: Record<string, unknown>) => ({
    github_id: String(r.id),
    name: r.name,
    full_name: r.full_name,
    description: r.description ?? null,
    url: r.html_url,
    default_branch: r.default_branch ?? "main",
    is_private: r.private ?? false,
    stars: r.stargazers_count ?? 0,
    forks: r.forks_count ?? 0,
    open_issues: r.open_issues_count ?? 0,
    language: r.language ?? null,
    topics: r.topics ?? [],
    category: classify(r as { name: string; topics?: string[]; description?: string | null }),
    last_synced: new Date().toISOString(),
  }));

  const { error } = await db.from("rald_cc_github_repos").upsert(upserts, { onConflict: "github_id" });
  if (error) return c.json({ error: error.message }, 500);

  const payload = await verifyToken(token, c.env);
  await writeAudit(db, payload!.username, "github.sync", "github", c.req.header("CF-Connecting-IP") ?? "unknown", { count: repos.length });

  return c.json({ synced: repos.length, at: new Date().toISOString() });
});

github.get("/api/github/repos/:name/workflows", async (c) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");
  if (!token || !await verifyToken(token, c.env)) return c.json({ error: "Unauthorized" }, 401);
  const name = c.req.param("name");
  const data = await ghFetch(`/repos/${ORG}/${name}/actions/runs?per_page=10`, c.env.GITHUB_TOKEN);
  return c.json(data);
});

export default github;
