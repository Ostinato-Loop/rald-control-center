export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  GITHUB_TOKEN: string;
  N8N_URL: string;
  N8N_API_KEY: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
  AWS_REGION: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_KEY?: string;
};
