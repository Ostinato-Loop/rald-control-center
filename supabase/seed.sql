-- RALD Control Center — Seed Data
-- NOTE: Admin password must be set via /api/auth/setup-admin after first deploy
-- or update this hash using the hashPassword function from the Worker

-- AI Providers (no API keys — add via dashboard)
insert into ai_providers (name, provider_type, is_active, routing_priority, supported_languages, total_tokens_used, total_cost_usd, request_count)
values
  ('OpenAI', 'openai', true, 1, '["en","yo","ig","ha","sw"]', 496747, 310.41, 9451),
  ('Anthropic Claude', 'anthropic', true, 2, '["en","yo","ig","ha","sw"]', 4618252, 305.51, 2755),
  ('Google Gemini', 'gemini', true, 3, '["en","yo","ig","ha","sw"]', 1450019, 327.78, 9760),
  ('DeepSeek', 'deepseek', true, 4, '["en","yo","ig","ha","sw"]', 4166186, 465.97, 1389),
  ('OpenAI Whisper', 'whisper', true, 5, '["en","yo","ig","ha","sw","pcm","tw","am","zu"]', 2807638, 474.90, 5233)
on conflict do nothing;

-- Language Packs
insert into language_packs (language_code, language_name, is_active, accuracy, dialect_count, slang_entries, voice_accent_count, translation_memory_size)
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
