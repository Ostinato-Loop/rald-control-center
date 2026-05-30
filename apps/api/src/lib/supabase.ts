import { createClient } from "@supabase/supabase-js";

export type Env = {
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  JWT_SECRET: string;
  GITHUB_TOKEN: string;
  N8N_URL: string;
  N8N_API_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  AWS_REGION: string;
  ENVIRONMENT?: string;
  SESSION_SECRET?: string;
};

export function getSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}
