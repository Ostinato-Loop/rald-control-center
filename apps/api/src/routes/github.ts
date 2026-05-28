import { Hono } from "hono";
import type { Env } from "../lib/db.ts";
import { verifyToken } from "../lib/auth.ts";
import { writeAudit } from "../lib/audit.ts";

const github = new Hono<{ Bindings: Env }>();
const ORG = "Ostinato-Loop";

function classify(r: { name: string; topics?: string[]; description?: string | null }): string {
  const n = r.name.toLowerCase(), d = (r.description ?? "").toLowerCase(), t = (r.topics ?? []).join(" ").toLowerCase();
  if (n.includes("ai") || t.includes("ai") || d.includes("artificial") || d.includes("language model")) return "AI Services";
  if (n.includes("pay") || n.includes("wallet") || n.includes("checkout") || n.includes("escrow")) return "Payments";
  if (n.includes("loop") && !n.includes("voice")) return "Commerce";
  if (n.includes("voice") || t.includes("voice") || t.includes("speech") || n.includes("tts")) return "Voice Systems";
  if (n.includes("infra") || n.includes("observ") || n.includes("console") || n.includes("monitor")) return "Infrastructure";
  if (n.includes("msg") || n.includes("messenger") || n.includes("chat") || n.includes("event")) return "Messaging";
  if (n.includes("sdk") || n.includes("design") || n.includes("shared") || n.includes("lib")) return "Developer Tools";
  if (n.includes("security") || n.includes("auth") || n.includes("iam")) return "Security";
  return "Other";
}

async function ghFetch(path: string, token: string) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `token ${token}`, "User-Agent": "RALD-Control-Center/1.0", Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text()}`);
  return res.json();
}

github.get("/api/github/repos", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const { results: cached } = await c.env.DB.prepare("SELECT * FROM github_repos ORDER BY stars DESC").all();
  await writeAudit(c.env.DB, p.username, "github.list_repos", "github", c.req.header("CF-Connecting-IP")??"unknown");
  if (cached.length > 0) {
    return c.json(cached.map((r:Record<string,unknown>) => ({
      id: r.github_id, name: r.name, fullName: r.full_name, description: r.description,
      url: r.url, category: r.category, language: r.language, stars: r.stars,
      openIssues: r.open_issues, isPrivate: r.is_private===1, isArchived: r.is_archived===1, pushedAt: r.pushed_at,
    })));
  }
  let page = 1; const all: Record<string,unknown>[] = [];
  while (true) {
    const repos: Record<string,unknown>[] = await ghFetch(`/orgs/${ORG}/repos?per_page=100&page=${page}&sort=updated`, c.env.GITHUB_TOKEN) as Record<string,unknown>[];
    all.push(...repos); if (repos.length < 100) break; page++;
  }
  return c.json(all.map(r => ({
    id: r.id, name: r.name, fullName: r.full_name, description: r.description, url: r.html_url,
    category: classify(r as {name:string;topics?:string[];description?:string|null}),
    language: r.language, stars: r.stargazers_count, openIssues: r.open_issues_count,
    isPrivate: r.private, isArchived: r.archived, pushedAt: r.pushed_at,
  })));
});

github.post("/api/github/sync", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  const repos: Record<string,unknown>[] = await ghFetch(`/orgs/${ORG}/repos?per_page=100&sort=updated`, c.env.GITHUB_TOKEN) as Record<string,unknown>[];
  const now = new Date().toISOString();
  for (const r of repos) {
    const cat = classify(r as {name:string;topics?:string[];description?:string|null});
    await c.env.DB.prepare(
      "INSERT OR REPLACE INTO github_repos (id,github_id,name,full_name,description,url,default_branch,is_private,stars,forks,open_issues,language,topics,category,last_synced,pushed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(crypto.randomUUID(), String(r.id), r.name, r.full_name, r.description??null, r.html_url, r.default_branch??"main", r.private?1:0, r.stargazers_count??0, r.forks_count??0, r.open_issues_count??0, r.language??null, JSON.stringify(r.topics??[]), cat, now, r.pushed_at??null).run();
  }
  await writeAudit(c.env.DB, p.username, "github.sync", "github", c.req.header("CF-Connecting-IP")??"unknown", { count: repos.length });
  return c.json({ synced: repos.length, at: now });
});

github.get("/api/github/repos/:name/workflows", async (c) => {
  const p = await verifyToken(c.req.header("Authorization")?.replace("Bearer ","") ?? "", c.env);
  if (!p) return c.json({ error: "Unauthorized" }, 401);
  return c.json(await ghFetch(`/repos/${ORG}/${c.req.param("name")}/actions/runs?per_page=10`, c.env.GITHUB_TOKEN));
});

export default github;
