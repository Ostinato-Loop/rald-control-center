const BASE = import.meta.env.VITE_API_URL ?? "/api";

function getToken() {
  return localStorage.getItem("rald_token");
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body != null ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.message ?? err.error ?? `HTTP ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  get: <T>(path: string) => req<T>("GET", path),
  post: <T>(path: string, body?: unknown) => req<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => req<T>("PATCH", path, body),
  delete: <T>(path: string) => req<T>("DELETE", path),
};

export type User = { id: string; username: string; email: string; role: string; createdAt: string };
export type AiProvider = {
  id: string; name: string; provider_type: string; is_active: boolean;
  hasKey: boolean; routing_priority: number; total_tokens_used: number;
  total_cost_usd: number; request_count: number; supported_languages: string[];
};
export type AiModel = {
  id: string; model_name: string; provider_id: string; capabilities: string[];
  context_window: number; avg_cost_per_1k: number; avg_latency_ms: number;
  routing_priority: number; is_active: boolean;
};
export type LanguagePack = {
  id: string; language_code: string; language_name: string; is_active: boolean;
  dialect_count: number; slang_entries: number; voice_accent_count: number; accuracy: number;
};
export type AuditLog = {
  id: string; username: string; action: string; resource: string; ip_address: string;
  metadata: Record<string, unknown> | null; created_at: string;
};
export type GithubRepo = {
  id: number; name: string; fullName: string; description: string | null; url: string;
  category: string; language: string | null; stars: number; openIssues: number;
  isPrivate: boolean; isArchived: boolean; pushedAt: string;
};
export type DashboardSummary = {
  activeProviders: number; activeModels: number; activeLanguages: number;
  aiCosts: { totalCostUsd: number; totalTokens: number; byProvider: { provider: string; costUsd: number; tokens: number }[]; last30Days: number; last7Days: number };
  githubStats: { totalRepos: number; aiRepos: number; totalStars: number; totalOpenIssues: number; categories: Record<string, number> };
  infrastructure: { overall: string; services: { name: string; status: string; latencyMs?: number }[]; checkedAt: string };
  recentAudit: AuditLog[];
};
