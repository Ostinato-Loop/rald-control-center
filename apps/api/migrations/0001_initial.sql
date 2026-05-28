CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','operator','viewer')),
  is_active INTEGER NOT NULL DEFAULT 1, last_login TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, provider_type TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 1,
  api_key_encrypted TEXT, routing_priority INTEGER NOT NULL DEFAULT 99,
  supported_languages TEXT NOT NULL DEFAULT '["en"]', total_tokens_used INTEGER NOT NULL DEFAULT 0,
  total_cost_usd REAL NOT NULL DEFAULT 0, avg_latency_ms INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0, failure_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS ai_models (
  id TEXT PRIMARY KEY, provider_id TEXT REFERENCES ai_providers(id) ON DELETE SET NULL,
  model_name TEXT NOT NULL, display_name TEXT, capabilities TEXT NOT NULL DEFAULT '[]',
  language_support TEXT NOT NULL DEFAULT '["en"]', context_window INTEGER NOT NULL DEFAULT 4096,
  avg_cost_per_1k REAL NOT NULL DEFAULT 0, avg_latency_ms INTEGER NOT NULL DEFAULT 0,
  routing_priority INTEGER NOT NULL DEFAULT 99, is_active INTEGER NOT NULL DEFAULT 1,
  health_status TEXT NOT NULL DEFAULT 'unknown', created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS github_repos (
  id TEXT PRIMARY KEY, github_id TEXT UNIQUE NOT NULL, name TEXT NOT NULL, full_name TEXT NOT NULL,
  description TEXT, url TEXT NOT NULL, default_branch TEXT NOT NULL DEFAULT 'main',
  is_private INTEGER NOT NULL DEFAULT 0, stars INTEGER NOT NULL DEFAULT 0, forks INTEGER NOT NULL DEFAULT 0,
  open_issues INTEGER NOT NULL DEFAULT 0, language TEXT, topics TEXT NOT NULL DEFAULT '[]',
  category TEXT NOT NULL DEFAULT 'Other', is_archived INTEGER NOT NULL DEFAULT 0,
  last_synced TEXT, pushed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS language_packs (
  id TEXT PRIMARY KEY, language_code TEXT UNIQUE NOT NULL, language_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1, dialect_count INTEGER NOT NULL DEFAULT 0,
  slang_entries INTEGER NOT NULL DEFAULT 0, translation_memory_size INTEGER NOT NULL DEFAULT 0,
  voice_accent_count INTEGER NOT NULL DEFAULT 0, accuracy REAL NOT NULL DEFAULT 0,
  last_updated TEXT NOT NULL DEFAULT (datetime('now')), created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT NOT NULL, username TEXT NOT NULL, action TEXT NOT NULL, resource TEXT NOT NULL,
  ip_address TEXT, metadata TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_providers_active ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_repos_category ON github_repos(category);
INSERT OR IGNORE INTO ai_providers (id,name,provider_type,is_active,routing_priority,supported_languages,total_tokens_used,total_cost_usd,request_count) VALUES
  ('p-openai','OpenAI','openai',1,1,'["en","yo","ig","ha","sw"]',496747,310.41,9451),
  ('p-claude','Anthropic Claude','anthropic',1,2,'["en","yo","ig","ha","sw"]',4618252,305.51,2755),
  ('p-gemini','Google Gemini','gemini',1,3,'["en","yo","ig","ha","sw"]',1450019,327.78,9760),
  ('p-deepseek','DeepSeek','deepseek',1,4,'["en","yo","ig","ha","sw"]',4166186,465.97,1389),
  ('p-whisper','OpenAI Whisper','whisper',1,5,'["en","yo","ig","ha","sw","pcm","tw","am","zu"]',2807638,474.90,5233);
INSERT OR IGNORE INTO ai_models (id,provider_id,model_name,display_name,capabilities,language_support,context_window,avg_cost_per_1k,avg_latency_ms,routing_priority,is_active) VALUES
  ('m-gpt4o','p-openai','gpt-4o','GPT-4o','["text","vision","function_calling"]','["en","yo","ig","ha","sw"]',128000,0.005,890,1,1),
  ('m-gpt4o-mini','p-openai','gpt-4o-mini','GPT-4o Mini','["text","function_calling"]','["en","yo","ig","ha","sw"]',128000,0.00015,320,2,1),
  ('m-claude35','p-claude','claude-3-5-sonnet-20241022','Claude 3.5 Sonnet','["text","vision","function_calling"]','["en","yo","ig","ha","sw"]',200000,0.003,1100,3,1),
  ('m-gemini15','p-gemini','gemini-1.5-pro','Gemini 1.5 Pro','["text","vision","function_calling"]','["en","yo","ig","ha","sw"]',1048576,0.00125,750,4,1),
  ('m-deepseek','p-deepseek','deepseek-chat','DeepSeek Chat','["text","function_calling"]','["en","yo","ig","ha","sw"]',65536,0.00027,680,5,1),
  ('m-whisper','p-whisper','whisper-large-v3','Whisper Large v3','["speech_to_text"]','["en","yo","ig","ha","sw","pcm","tw","am","zu"]',0,0.006,0,6,1);
INSERT OR IGNORE INTO language_packs (id,language_code,language_name,is_active,accuracy,dialect_count,slang_entries,voice_accent_count,translation_memory_size) VALUES
  ('lp-yo','yo','Yoruba',1,87.3,12,3420,8,6),('lp-ig','ig','Igbo',1,82.1,8,2100,5,4),
  ('lp-ha','ha','Hausa',1,91.5,15,4800,12,8),('lp-sw','sw','Swahili',1,94.2,20,8900,18,10),
  ('lp-pcm','pcm','Nigerian Pidgin',1,78.6,6,1560,4,3),('lp-tw','tw','Twi',1,75.4,7,980,3,2),
  ('lp-am','am','Amharic',1,88.9,11,5200,9,6),('lp-zu','zu','Zulu',1,83.7,9,2800,6,5);
