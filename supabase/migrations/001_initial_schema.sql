-- RALD Control Center Schema
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/onxdcikfttdmnhofsuwo/sql

create extension if not exists "uuid-ossp";

-- Control Center Users (separate from rald_profiles)
create table if not exists rald_cc_users (
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
create table if not exists rald_cc_ai_providers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  provider_type text not null,
  is_active boolean not null default true,
  api_key_encrypted text,
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

-- AI Models Registry
create table if not exists rald_cc_ai_models (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid references rald_cc_ai_providers(id) on delete set null,
  model_name text not null,
  display_name text,
  capabilities jsonb not null default '[]'::jsonb,
  language_support jsonb not null default '["en"]'::jsonb,
  context_window integer not null default 4096,
  avg_cost_per_1k numeric(10,6) not null default 0,
  avg_latency_ms integer not null default 0,
  routing_priority integer not null default 99,
  is_active boolean not null default true,
  health_status text not null default 'unknown',
  created_at timestamptz not null default now()
);

-- GitHub Repos
create table if not exists rald_cc_github_repos (
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
  created_at timestamptz not null default now()
);

-- Language Packs
create table if not exists rald_cc_language_packs (
  id uuid primary key default uuid_generate_v4(),
  language_code text unique not null,
  language_name text not null,
  is_active boolean not null default true,
  dialect_count integer not null default 0,
  slang_entries integer not null default 0,
  translation_memory_size integer not null default 0,
  voice_accent_count integer not null default 0,
  accuracy numeric(5,2) not null default 0,
  last_updated timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Control Center Audit Logs (separate from rald_audit_logs)
create table if not exists rald_cc_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  username text not null,
  action text not null,
  resource text not null,
  ip_address text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_rald_cc_audit_created on rald_cc_audit_logs(created_at desc);
create index if not exists idx_rald_cc_providers_active on rald_cc_ai_providers(is_active);
create index if not exists idx_rald_cc_repos_category on rald_cc_github_repos(category);

-- RLS
alter table rald_cc_users enable row level security;
alter table rald_cc_ai_providers enable row level security;
alter table rald_cc_ai_models enable row level security;
alter table rald_cc_github_repos enable row level security;
alter table rald_cc_language_packs enable row level security;
alter table rald_cc_audit_logs enable row level security;

-- Full access for service role
create policy "Service full access" on rald_cc_users for all to service_role using (true) with check (true);
create policy "Service full access" on rald_cc_ai_providers for all to service_role using (true) with check (true);
create policy "Service full access" on rald_cc_ai_models for all to service_role using (true) with check (true);
create policy "Service full access" on rald_cc_github_repos for all to service_role using (true) with check (true);
create policy "Service full access" on rald_cc_language_packs for all to service_role using (true) with check (true);
create policy "Service full access" on rald_cc_audit_logs for all to service_role using (true) with check (true);

-- Seed: AI Providers
insert into rald_cc_ai_providers (name, provider_type, is_active, routing_priority, supported_languages, total_tokens_used, total_cost_usd, request_count)
values
  ('OpenAI', 'openai', true, 1, '["en","yo","ig","ha","sw"]', 496747, 310.41, 9451),
  ('Anthropic Claude', 'anthropic', true, 2, '["en","yo","ig","ha","sw"]', 4618252, 305.51, 2755),
  ('Google Gemini', 'gemini', true, 3, '["en","yo","ig","ha","sw"]', 1450019, 327.78, 9760),
  ('DeepSeek', 'deepseek', true, 4, '["en","yo","ig","ha","sw"]', 4166186, 465.97, 1389),
  ('OpenAI Whisper', 'whisper', true, 5, '["en","yo","ig","ha","sw","pcm","tw","am","zu"]', 2807638, 474.90, 5233)
on conflict do nothing;

-- Seed: Language Packs
insert into rald_cc_language_packs (language_code, language_name, is_active, accuracy, dialect_count, slang_entries, voice_accent_count, translation_memory_size)
values
  ('yo', 'Yoruba', true, 87.3, 12, 3420, 8, 6),
  ('ig', 'Igbo', true, 82.1, 8, 2100, 5, 4),
  ('ha', 'Hausa', true, 91.5, 15, 4800, 12, 8),
  ('sw', 'Swahili', true, 94.2, 20, 8900, 18, 10),
  ('pcm', 'Nigerian Pidgin', true, 78.6, 6, 1560, 4, 3),
  ('tw', 'Twi', true, 75.4, 7, 980, 3, 2),
  ('am', 'Amharic', true, 88.9, 11, 5200, 9, 6),
  ('zu', 'Zulu', true, 83.7, 9, 2800, 6, 5)
on conflict (language_code) do nothing;

-- NOTE: Create admin via API after setup:
-- POST https://api.control.rald.cloud/api/auth/setup-admin
-- {"username":"admin","email":"admin@rald.cloud","password":"rald-admin-2024"}
