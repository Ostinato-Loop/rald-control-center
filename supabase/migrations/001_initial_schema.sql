-- RALD Control Center — Initial Schema
-- Run this in Supabase SQL Editor or via Supabase CLI

create extension if not exists "uuid-ossp";

-- Users
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  username text unique not null,
  email text unique not null,
  password_hash text not null,
  role text not null default 'viewer' check (role in ('admin', 'operator', 'viewer')),
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AI Providers
create table if not exists ai_providers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  provider_type text not null check (provider_type in ('openai', 'anthropic', 'gemini', 'deepseek', 'whisper', 'local', 'custom')),
  is_active boolean not null default true,
  api_key_encrypted text,
  api_key_hint text,
  key_last_rotated timestamptz,
  routing_priority integer not null default 99,
  supported_languages jsonb not null default '["en"]'::jsonb,
  total_tokens_used bigint not null default 0,
  total_cost_usd numeric(12,4) not null default 0,
  avg_latency_ms integer not null default 0,
  request_count bigint not null default 0,
  failure_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- AI Models (Registry)
create table if not exists ai_models (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid references ai_providers(id) on delete set null,
  model_name text not null,
  display_name text,
  capabilities jsonb not null default '[]'::jsonb,
  language_support jsonb not null default '["en"]'::jsonb,
  context_window integer not null default 4096,
  avg_cost_per_1k numeric(10,6) not null default 0,
  avg_latency_ms integer not null default 0,
  routing_priority integer not null default 99,
  fallback_model_id uuid references ai_models(id) on delete set null,
  is_active boolean not null default true,
  health_status text not null default 'unknown' check (health_status in ('healthy', 'degraded', 'down', 'unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- GitHub Repos
create table if not exists github_repos (
  id uuid primary key default uuid_generate_v4(),
  github_id text unique not null,
  name text not null,
  full_name text not null,
  description text,
  url text not null,
  default_branch text not null default 'main',
  is_private boolean not null default false,
  stars integer not null default 0,
  forks integer not null default 0,
  open_issues integer not null default 0,
  language text,
  topics jsonb not null default '[]'::jsonb,
  category text not null default 'Other',
  is_archived boolean not null default false,
  last_synced timestamptz,
  pushed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Language Packs
create table if not exists language_packs (
  id uuid primary key default uuid_generate_v4(),
  language_code text unique not null,
  language_name text not null,
  is_active boolean not null default true,
  model_id uuid references ai_models(id) on delete set null,
  dialect_count integer not null default 0,
  slang_entries integer not null default 0,
  translation_memory_size integer not null default 0,
  voice_accent_count integer not null default 0,
  accuracy numeric(5,2) not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Audit Logs
create table if not exists audit_logs (
  id uuid primary key default uuid_generate_v4(),
  username text not null,
  action text not null,
  resource text not null,
  ip_address text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_audit_logs_created_at on audit_logs(created_at desc);
create index if not exists idx_audit_logs_username on audit_logs(username);
create index if not exists idx_audit_logs_action on audit_logs(action);
create index if not exists idx_ai_providers_active on ai_providers(is_active, routing_priority);
create index if not exists idx_ai_models_active on ai_models(is_active, routing_priority);
create index if not exists idx_github_repos_category on github_repos(category);
create index if not exists idx_language_packs_active on language_packs(is_active);

-- RLS (Row Level Security) — disabled for service key access, enable per-user as needed
alter table users enable row level security;
alter table ai_providers enable row level security;
alter table ai_models enable row level security;
alter table github_repos enable row level security;
alter table language_packs enable row level security;
alter table audit_logs enable row level security;

-- Service role has full access (used by the Cloudflare Worker)
create policy "Service role full access" on users for all using (true) with check (true);
create policy "Service role full access" on ai_providers for all using (true) with check (true);
create policy "Service role full access" on ai_models for all using (true) with check (true);
create policy "Service role full access" on github_repos for all using (true) with check (true);
create policy "Service role full access" on language_packs for all using (true) with check (true);
create policy "Service role full access" on audit_logs for all using (true) with check (true);
